import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { classifyReceiptImage } from '@/lib/classifier';
import { uploadToDrive } from '@/lib/drive';
import { saveRecord } from '@/lib/storage';
import { UploadReceiptResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    if (!ALLOWED_MIME_TYPES.includes(file.type)) return NextResponse.json({ success: false, error: 'Unsupported file type. Use JPG, PNG, or WebP.' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File too large. Max 10 MB.' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const extMap: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic' };
    const ext = extMap[file.type] ?? '.jpg';
    const now = new Date();
    const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Step 1: AI reads image + classifies in one shot
    console.log('[UPLOAD] Sending image to AI for classification...');
    const aiResult = await classifyReceiptImage(buffer, file.type);
    console.log('[UPLOAD] AI result:', aiResult);

    // Step 2: Upload to correct Drive folder
    const fileName = buildFileName(aiResult.merchant, now, ext);
    const driveResult = await uploadToDrive(buffer, fileName, file.type, aiResult.category, monthLabel);
    console.log('[UPLOAD] Saved to:', driveResult.folderName);

    // Step 3: Save record
    const record = {
      id: uuidv4(),
      fileName,
      originalName: file.name,
      category: aiResult.category,
      group: driveResult.group,
      merchant: aiResult.merchant,
      total: aiResult.total,
      driveFileId: driveResult.fileId,
      driveLink: driveResult.fileLink,
      folderId: driveResult.folderId,
      folderName: driveResult.folderName,
      uploadedAt: now.toISOString(),
      ocrText: '',
    };

    saveRecord(record);
    return NextResponse.json({ success: true, record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[UPLOAD] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
