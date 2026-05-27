import { NextRequest, NextResponse } from 'next/server';
import { classifyReceiptImage } from '@/lib/classifier';
import { CATEGORY_GROUP_MAP } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('receipt') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await classifyReceiptImage(buffer, file.type);
    const group = CATEGORY_GROUP_MAP[result.category];

    return NextResponse.json({
      category: result.category,
      group,
      merchant: result.merchant,
      total: result.total,
      driveFolder: `${group}/${result.category}`,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
