export type ReceiptCategory =
  | 'Food & Beverage'
  | 'Transport'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Travel'
  | 'Office / Work'
  | 'Others';

export const CATEGORIES: ReceiptCategory[] = [
  'Food & Beverage',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Travel',
  'Office / Work',
  'Others',
];

export const CATEGORY_FOLDER_MAP: Record<ReceiptCategory, string> = {
  'Food & Beverage': 'Food',
  'Transport': 'Transport',
  'Shopping': 'Shopping',
  'Bills & Utilities': 'Bills',
  'Travel': 'Travel',
  'Office / Work': 'Office',
  'Others': 'Others',
};

export interface ReceiptRecord {
  id: string;
  fileName: string;
  originalName: string;
  category: ReceiptCategory;
  merchant?: string;
  total?: string;
  driveFileId: string;
  driveLink: string;
  folderId: string;
  folderName: string;
  uploadedAt: string;
  ocrText?: string;
}

export interface UploadReceiptResponse {
  success: boolean;
  record?: ReceiptRecord;
  error?: string;
}
