import { ReceiptCategory, ReceiptGroup, CATEGORY_GROUP_MAP } from '@/lib/types';

const GROUP_COLOR: Record<ReceiptGroup, string> = {
  'Tax Deductible (Personal)': 'bg-green-100 text-green-700',
  'Business Operations':       'bg-blue-100 text-blue-700',
  'Daily Personal Finance':    'bg-orange-100 text-orange-700',
};

const ICON_MAP: Record<ReceiptCategory, string> = {
  'Medical expenses':        '🏥',
  'Education fees':          '🎓',
  'Lifestyle & sports':      '🏋️',
  'Childcare costs':         '👶',
  'Insurance & retirement':  '🛡️',
  'Charity donations':       '❤️',
  'Travel & lodging':        '✈️',
  'Client entertainment':    '🍽️',
  'Office rent & utilities': '🏢',
  'Software & tech':         '💻',
  'Marketing & ads':         '📢',
  'Staff payroll':           '👥',
  'Repairs & maintenance':   '🔧',
  'Groceries':               '🛒',
  'Dining out':              '🍔',
  'Fuel & transit':          '⛽',
  'Home bills':              '💡',
  'Leisure & hobbies':       '🎮',
};

export default function CategoryBadge({ category }: { category: ReceiptCategory }) {
  const group = CATEGORY_GROUP_MAP[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${GROUP_COLOR[group]}`}>
      <span>{ICON_MAP[category]}</span>
      {category}
    </span>
  );
}
