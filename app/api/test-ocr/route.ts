import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/ocr';
import { classifyReceipt } from '@/lib/classifier';
import { CATEGORY_GROUP_MAP } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('receipt') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ocr = await extractTextFromImage(buffer);
    const category = await classifyReceipt(ocr);
    const group = CATEGORY_GROUP_MAP[category];

    return NextResponse.json({
      ocrSuccess: !ocr.ocrError,
      ocrError: ocr.ocrError,
      textLength: ocr.text.length,
      merchant: ocr.merchant,
      total: ocr.total,
      items: ocr.items.slice(0, 10),
      fullText: ocr.text.slice(0, 600),
      category,
      group,
      driveFolder: `${group}/${category}`,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
