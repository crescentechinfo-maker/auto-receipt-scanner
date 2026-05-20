import { NextResponse } from 'next/server';
import { getAllRecords } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const records = getAllRecords();
    return NextResponse.json({ success: true, records });
  } catch (err) {
    console.error('History error:', err);
    return NextResponse.json({ success: false, records: [], error: 'Failed to load history' }, { status: 500 });
  }
}
