import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromImage } from '@/lib/ocr';
import { classifyReceipt } from '@/lib/classifier';
import { uploadToDrive } from '@/lib/drive';
import { saveRecord } from '@/lib/storage';
import { UploadReceiptResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function buildFileName(merchant: string | undefined, date: Date, ext: string): string {
  const cleanMerchant = (merchant || 'Receipt')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30);
  const dateStr = date
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '');
  return `${cleanMerchant}_${dateStr}${ext}`;
}

export async function POST(req: NextRequest): Promise<NextResponse<UploadReceiptResponse>> {
  try {
    const formData = await req.formData();
    const file = formData.get('receipt') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type. Use JPG, PNG, or WebP.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Max 10 MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/heic': '.heic',
    };
    const ext = extMap[file.type] ?? '.jpg';

    const now = new Date();
    const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Step 1: OCR
    const ocrResult = await extractTextFromImage(buffer);

    // Step 2: Classify
    const category = await classifyReceipt(ocrResult);

    // Step 3: Build file name
    const fileName = buildFileName(ocrResult.merchant, now, ext);

    // Step 4: Upload to Drive
    const driveResult = await uploadToDrive(buffer, fileName, file.type, category, monthLabel);

    // Step 5: Save record
    const record = {
      id: uuidv4(),
      fileName,
      originalName: file.name,
      category,
      merchant: ocrResult.merchant,
      total: ocrResult.total,
      driveFileId: driveResult.fileId,
      driveLink: driveResult.fileLink,
      folderId: driveResult.folderId,
      folderName: driveResult.folderName,
      uploadedAt: now.toISOString(),
      ocrText: ocrResult.text.slice(0, 500),
    };

    saveRecord(record);

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Check server logs.' },
      { status: 500 }
    );
  }
}
