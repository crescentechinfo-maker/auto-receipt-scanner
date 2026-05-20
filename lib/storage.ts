import fs from 'fs';
import path from 'path';
import { ReceiptRecord } from './types';

// Simple JSON file-based storage for receipt history
// Replace with a database (e.g. Vercel KV, Supabase) for production scale
const DATA_FILE = path.join(process.cwd(), 'data', 'receipts.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

export function getAllRecords(): ReceiptRecord[] {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as ReceiptRecord[];
}

export function saveRecord(record: ReceiptRecord): void {
  ensureDataFile();
  const records = getAllRecords();
  records.unshift(record); // newest first
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}
