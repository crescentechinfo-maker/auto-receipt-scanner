'use client';

import { useState } from 'react';
import Link from 'next/link';
import UploadZone from '@/components/UploadZone';
import StatusTracker, { UploadStep } from '@/components/StatusTracker';
import ResultCard from '@/components/ResultCard';
import { ReceiptRecord } from '@/lib/types';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>('idle');
  const [result, setResult] = useState<ReceiptRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError(null);
    setResult(null);
    setStep('processing');

    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      setStep('categorizing');
      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      setStep('uploading');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setStep('done');
      setResult(data.record);
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStep('idle');
    setResult(null);
    setError(null);
  };

  const isProcessing = ['processing', 'categorizing', 'uploading'].includes(step);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧾</span>
            <span className="font-bold text-gray-800 text-lg">ReceiptScan</span>
          </div>
          <Link
            href="/history"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Scan Your Receipt</h1>
          <p className="text-gray-500 text-sm">
            AI reads &amp; categorizes your receipt, then saves it to Google Drive automatically.
          </p>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <UploadZone onFileSelected={setSelectedFile} disabled={isProcessing} />

          {step !== 'idle' && step !== 'done' && <StatusTracker step={step} />}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step !== 'done' ? (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {isProcessing ? 'Processing…' : 'Upload Receipt'}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-base hover:bg-indigo-50 transition"
            >
              Scan Another Receipt
            </button>
          )}
        </div>

        {result && <ResultCard record={result} />}

        {/* How it works */}
        {step === 'idle' && (
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: '📷', title: 'Capture', desc: 'Take a photo or upload' },
              { icon: '🤖', title: 'AI Reads', desc: 'OCR + smart category detection' },
              { icon: '📂', title: 'Auto Sort', desc: 'Saved to Google Drive' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
