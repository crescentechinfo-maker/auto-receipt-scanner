export type ReceiptGroup =
  | 'Tax Deductible (Personal)'
  | 'Business Operations'
  | 'Daily Personal Finance';

export type ReceiptCategory =
  // Tax Deductible (Personal)
  | 'Medical expenses'
  | 'Education fees'
  | 'Lifestyle & sports'
  | 'Childcare costs'
  | 'Insurance & retirement'
  | 'Charity donations'
  // Business Operations
  | 'Travel & lodging'
  | 'Client entertainment'
  | 'Office rent & utilities'
  | 'Software & tech'
  | 'Marketing & ads'
  | 'Staff payroll'
  | 'Repairs & maintenance'
  // Daily Personal Finance
  | 'Groceries'
  | 'Dining out'
  | 'Fuel & transit'
  | 'Home bills'
  | 'Leisure & hobbies';

export const CATEGORY_GROUP_MAP: Record<ReceiptCategory, ReceiptGroup> = {
  'Medical expenses':        'Tax Deductible (Personal)',
  'Education fees':          'Tax Deductible (Personal)',
  'Lifestyle & sports':      'Tax Deductible (Personal)',
  'Childcare costs':         'Tax Deductible (Personal)',
  'Insurance & retirement':  'Tax Deductible (Personal)',
  'Charity donations':       'Tax Deductible (Personal)',
  'Travel & lodging':        'Business Operations',
  'Client entertainment':    'Business Operations',
  'Office rent & utilities': 'Business Operations',
  'Software & tech':         'Business Operations',
  'Marketing & ads':         'Business Operations',
  'Staff payroll':           'Business Operations',
  'Repairs & maintenance':   'Business Operations',
  'Groceries':               'Daily Personal Finance',
  'Dining out':              'Daily Personal Finance',
  'Fuel & transit':          'Daily Personal Finance',
  'Home bills':              'Daily Personal Finance',
  'Leisure & hobbies':       'Daily Personal Finance',
};

export const GROUPS: ReceiptGroup[] = [
  'Tax Deductible (Personal)',
  'Business Operations',
  'Daily Personal Finance',
];

export const CATEGORIES: ReceiptCategory[] = [
  'Medical expenses',
  'Education fees',
  'Lifestyle & sports',
  'Childcare costs',
  'Insurance & retirement',
  'Charity donations',
  'Travel & lodging',
  'Client entertainment',
  'Office rent & utilities',
  'Software & tech',
  'Marketing & ads',
  'Staff payroll',
  'Repairs & maintenance',
  'Groceries',
  'Dining out',
  'Fuel & transit',
  'Home bills',
  'Leisure & hobbies',
];

export interface ReceiptRecord {
  id: string;
  fileName: string;
  originalName: string;
  category: ReceiptCategory;
  group: ReceiptGroup;
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
