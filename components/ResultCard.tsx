'use client';

import { ReceiptRecord } from '@/lib/types';
import CategoryBadge from './CategoryBadge';

interface ResultCardProps {
  record: ReceiptRecord;
}

export default function ResultCard({ record }: ResultCardProps) {
  return (
    <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="font-semibold text-green-800">Receipt uploaded successfully!</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Merchant</p>
          <p className="font-medium text-gray-800">{record.merchant || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Total</p>
          <p className="font-medium text-gray-800">{record.total || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Category</p>
          <CategoryBadge category={record.category} />
        </div>
        <div>
          <p className="text-gray-500 text-xs">Saved as</p>
          <p className="font-medium text-gray-800 truncate text-xs">{record.fileName}</p>
        </div>
      </div>

      <div>
        <p className="text-gray-500 text-xs mb-1">Google Drive folder</p>
        <p className="text-xs text-indigo-700 font-mono bg-indigo-50 rounded px-2 py-1">{record.folderName}</p>
      </div>

      <a
        href={record.driveLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View in Google Drive
      </a>
    </div>
  );
}
