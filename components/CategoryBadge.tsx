import { ReceiptCategory } from '@/lib/types';

const COLOR_MAP: Record<ReceiptCategory, string> = {
  'Food & Beverage': 'bg-orange-100 text-orange-700',
  'Transport': 'bg-blue-100 text-blue-700',
  'Shopping': 'bg-pink-100 text-pink-700',
  'Bills & Utilities': 'bg-yellow-100 text-yellow-700',
  'Travel': 'bg-teal-100 text-teal-700',
  'Office / Work': 'bg-purple-100 text-purple-700',
  'Others': 'bg-gray-100 text-gray-600',
};

const ICON_MAP: Record<ReceiptCategory, string> = {
  'Food & Beverage': '🍔',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Bills & Utilities': '💡',
  'Travel': '✈️',
  'Office / Work': '💼',
  'Others': '📋',
};

export default function CategoryBadge({ category }: { category: ReceiptCategory }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${COLOR_MAP[category]}`}>
      <span>{ICON_MAP[category]}</span>
      {category}
    </span>
  );
}
