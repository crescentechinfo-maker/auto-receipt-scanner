'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CategoryBadge from '@/components/CategoryBadge';
import { ReceiptRecord, ReceiptCategory, CATEGORIES } from '@/lib/types';

const CATEGORY_ICON: Record<ReceiptCategory, string> = {
  'Food & Beverage': '🍔',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Bills & Utilities': '💡',
  'Travel': '✈️',
  'Office / Work': '💼',
  'Others': '📋',
};

export default function HistoryPage() {
  const [records, setRecords] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReceiptCategory | 'All'>('All');

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => setRecords(d.records || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? records : records.filter(r => r.category === filter);

  // Stats
  const byCategory = CATEGORIES.map(cat => ({
    category: cat,
    count: records.filter(r => r.category === cat).length,
  })).filter(c => c.count > 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
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

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Receipt History</h1>

        {/* Stats */}
        {byCategory.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {byCategory.slice(0, 4).map(({ category, count }) => (
              <div key={category} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                <div className="text-2xl mb-1">{CATEGORY_ICON[category]}</div>
                <div className="text-xl font-bold text-gray-800">{count}</div>
                <div className="text-xs text-gray-400">{category.split(' & ')[0]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['All', ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${filter === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >
              {cat === 'All' ? `All (${records.length})` : `${CATEGORY_ICON[cat]} ${cat}`}
            </button>
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
              <div
                key={record.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4"
              >
                <div className="text-2xl flex-shrink-0">{CATEGORY_ICON[record.category]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800 truncate">
                      {record.merchant || record.fileName}
                    </p>
                    {record.total && (
                      <span className="font-bold text-gray-900 flex-shrink-0">{record.total}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <CategoryBadge category={record.category} />
                    <span className="text-xs text-gray-400">
                      {new Date(record.uploadedAt).toLocaleDateString('en-MY', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate font-mono">{record.folderName}</p>
                </div>
                <a
                  href={record.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-indigo-400 hover:text-indigo-600 transition"
                  title="View in Drive"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
