import fs from 'fs';
import path from 'path';
import { ReceiptRecord } from './types';

// Use /tmp on Vercel (read-only filesystem), local data/ otherwise
const DATA_FILE = process.env.VERCEL
  ? '/tmp/receipts.json'
  : path.join(process.cwd(), 'data', 'receipts.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

export function getAllRecords(): ReceiptRecord[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as ReceiptRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(record: ReceiptRecord): void {
  try {
    ensureDataFile();
    const records = getAllRecords();
    records.unshift(record);
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal: upload to Drive already succeeded
    console.warn('Could not save history record:', err);
  }
}
