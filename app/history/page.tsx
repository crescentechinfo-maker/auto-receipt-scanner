'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CategoryBadge from '@/components/CategoryBadge';
import { ReceiptRecord, ReceiptGroup, GROUPS, CATEGORIES, CATEGORY_GROUP_MAP } from '@/lib/types';

const GROUP_ICON: Record<ReceiptGroup, string> = {
  'Tax Deductible (Personal)': '🧾',
  'Business Operations':       '💼',
  'Daily Personal Finance':    '🛒',
};

const CATEGORY_ICON: Record<string, string> = {
  'Medical expenses': '🏥', 'Education fees': '🎓', 'Lifestyle & sports': '🏋️',
  'Childcare costs': '👶', 'Insurance & retirement': '🛡️', 'Charity donations': '❤️',
  'Travel & lodging': '✈️', 'Client entertainment': '🍽️', 'Office rent & utilities': '🏢',
  'Software & tech': '💻', 'Marketing & ads': '📢', 'Staff payroll': '👥',
  'Repairs & maintenance': '🔧', 'Groceries': '🛒', 'Dining out': '🍔',
  'Fuel & transit': '⛽', 'Home bills': '💡', 'Leisure & hobbies': '🎮',
};

type FilterType = 'All' | ReceiptGroup | string;

export default function HistoryPage() {
  const [records, setRecords] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => setRecords(d.records || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All'
    ? records
    : GROUPS.includes(filter as ReceiptGroup)
      ? records.filter(r => r.group === filter)
      : records.filter(r => r.category === filter);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-bold text-lg">🧾 ReceiptScan</span>
          </Link>
          <span className="text-sm text-gray-500">{records.length} receipts</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Receipt History</h1>

        {/* Group stats */}
        {records.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {GROUPS.map(g => {
              const count = records.filter(r => r.group === g).length;
              return (
                <button key={g} onClick={() => setFilter(g)}
                  className={`rounded-2xl border p-4 text-center transition shadow-sm
                    ${filter === g ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-white hover:border-indigo-200'}`}>
                  <div className="text-2xl mb-1">{GROUP_ICON[g]}</div>
                  <div className="text-xl font-bold text-gray-800">{count}</div>
                  <div className="text-xs text-gray-400 leading-tight">{g.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="space-y-2">
          {/* All button */}
          <button onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition mr-2
              ${filter === 'All' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            All ({records.length})
          </button>

          {/* Group + subcategory filters */}
          {GROUPS.map(group => (
            <div key={group} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1 pr-1">
                {GROUP_ICON[group]}
              </span>
              {CATEGORIES.filter(c => CATEGORY_GROUP_MAP[c] === group).map(cat => (
                <button key={cat} onClick={() => setFilter(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                    ${filter === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                  {CATEGORY_ICON[cat]} {cat}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <p className="text-4xl">📭</p>
            <p className="font-medium">No receipts yet</p>
            <Link href="/" className="text-sm text-indigo-600 hover:underline">Upload your first receipt</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(record => (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">{CATEGORY_ICON[record.category]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800 truncate">{record.merchant || record.fileName}</p>
                    {record.total && <span className="font-bold text-gray-900 flex-shrink-0">{record.total}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <CategoryBadge category={record.category} />
                    <span className="text-xs text-gray-400">
                      {new Date(record.uploadedAt).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate font-mono">{record.folderName}</p>
                </div>
                <a href={record.driveLink} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 text-indigo-400 hover:text-indigo-600 transition" title="View in Drive">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
