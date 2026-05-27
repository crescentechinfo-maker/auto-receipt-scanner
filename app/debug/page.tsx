'use client';

import { useState } from 'react';

export default function DebugPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append('receipt', file);
    const res = await fetch('/api/test-ocr', { method: 'POST', body: fd });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">🔍 OCR + Category Debug</h1>
      <p className="text-gray-500 text-sm">Upload a receipt to see exactly what the AI extracts and which category it picks.</p>

      <input type="file" accept="image/*" onChange={handleFile}
        className="block w-full border border-gray-200 rounded-xl p-3 text-sm" />

      {loading && <p className="text-indigo-600 animate-pulse font-medium">Processing...</p>}

      {result && (
        <div className="space-y-4">
          {/* Status */}
          <div className={`rounded-xl p-4 ${result.ocrSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="font-semibold">{result.ocrSuccess ? '✅ OCR Success' : '❌ OCR Failed'}</p>
            {result.ocrError && <p className="text-sm text-red-600 mt-1">{result.ocrError as string}</p>}
            <p className="text-sm text-gray-600 mt-1">Text extracted: <b>{result.textLength as number} chars</b></p>
          </div>

          {/* Category result */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Detected Category</p>
            <p className="text-xl font-bold text-indigo-700">{String(result.category)}</p>
            <p className="text-sm text-gray-500">{String(result.group)}</p>
            <p className="text-sm font-mono text-indigo-600 mt-1">📁 {String(result.driveFolder)}</p>
          </div>

          {/* Extracted fields */}
          <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-2">
            <p className="font-semibold text-sm">Extracted Fields</p>
            <p className="text-sm">🏪 Merchant: <b>{String(result.merchant || '—')}</b></p>
            <p className="text-sm">💰 Total: <b>{String(result.total || '—')}</b></p>
            <p className="text-sm">📝 Items: {(result.items as string[])?.join(', ') || '—'}</p>
          </div>

          {/* Raw OCR text */}
          {result.fullText && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <p className="font-semibold text-sm mb-2">Raw OCR Text</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">{String(result.fullText)}</pre>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
