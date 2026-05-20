'use client';

export type UploadStep = 'idle' | 'processing' | 'categorizing' | 'uploading' | 'done' | 'error';

const STEPS: { key: UploadStep; label: string }[] = [
  { key: 'processing', label: 'Reading receipt (OCR)' },
  { key: 'categorizing', label: 'Detecting category (AI)' },
  { key: 'uploading', label: 'Uploading to Drive' },
  { key: 'done', label: 'Done!' },
];

const ORDER: UploadStep[] = ['processing', 'categorizing', 'uploading', 'done'];

interface StatusTrackerProps {
  step: UploadStep;
}

export default function StatusTracker({ step }: StatusTrackerProps) {
  if (step === 'idle') return null;

  const currentIndex = ORDER.indexOf(step);

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((s, i) => {
          const isCompleted = currentIndex > i || step === 'done';
          const isActive = currentIndex === i && step !== 'done' && step !== 'error';
          const isPending = currentIndex < i;

          return (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
              {/* Connector line */}
              <div className="w-full flex items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-all duration-500 ${isCompleted || isActive ? 'bg-indigo-500' : 'bg-gray-200'}`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300
                    ${isCompleted ? 'bg-green-500 text-white'
                      : isActive ? 'bg-indigo-500 text-white ring-4 ring-indigo-100'
                      : 'bg-gray-200 text-gray-400'}`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-all duration-500 ${isCompleted ? 'bg-indigo-500' : 'bg-gray-200'}`}
                  />
                )}
              </div>
              <span
                className={`text-xs text-center leading-tight hidden sm:block
                  ${isCompleted ? 'text-green-600 font-medium'
                    : isActive ? 'text-indigo-600 font-semibold'
                    : 'text-gray-400'}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {step === 'error' && (
        <p className="mt-3 text-center text-sm text-red-500 font-medium">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
