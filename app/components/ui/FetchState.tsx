'use client';

import { Button } from './Button';

interface LoadingStateProps {
  title?: string;
  description?: string;
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry: () => void;
}

export function LoadingState({
  title = 'Loading',
  description = 'Please wait while we load this page.',
}: LoadingStateProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load data',
  description = 'Please try again in a moment.',
  retryLabel = 'Retry',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-700">{description}</p>
      <Button variant="secondary" onClick={onRetry} className="mt-4">
        {retryLabel}
      </Button>
    </div>
  );
}
