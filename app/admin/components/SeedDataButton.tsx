'use client';

import { AlertCircle, CheckCircle2, Database, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SeedResults {
  checked?: { users: number; growers: number; dispensaries: number };
  created?: string[];
  errors?: string[];
  final?: { users: number; growers: number; dispensaries: number };
  error?: string;
}

export function SeedDataButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<SeedResults | null>(null);

  const handleSeed = async () => {
    setStatus('loading');
    setResults(null);

    try {
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await response.json();
      setResults(data);

      if (response.ok) {
        setStatus(data.errors?.length ? 'error' : 'success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
      setResults({ errors: ['Network error. Please try again.'] });
    }
  };

  const created = results?.created || [];
  const errors = results?.errors || (results?.error ? [results.error] : []);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleSeed}
        disabled={status === 'loading' || status === 'success'}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
          status === 'success'
            ? 'bg-green-600 text-white cursor-default'
            : status === 'error'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating demo accounts
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Demo data ready
          </>
        ) : (
          <>
            <Database className="h-4 w-4" />
            Seed demo data
          </>
        )}
      </button>

      {results && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          {results.checked && (
            <div>
              <p className="font-medium text-gray-900">Checked existing records</p>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div className="rounded-md bg-white p-2">
                  <dt>Users</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{results.checked.users}</dd>
                </div>
                <div className="rounded-md bg-white p-2">
                  <dt>Growers</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{results.checked.growers}</dd>
                </div>
                <div className="rounded-md bg-white p-2">
                  <dt>Dispensaries</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{results.checked.dispensaries}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-3">
            <p className="font-medium text-gray-900">Created</p>
            {created.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {created.map((account) => (
                  <li key={account} className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{account}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-gray-600">No new demo accounts were needed.</p>
            )}
          </div>

          {errors.length > 0 && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2">
              <p className="flex items-center gap-2 font-medium text-red-800">
                <AlertCircle className="h-4 w-4" />
                Errors
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {results.final && (
            <p className="mt-3 text-xs text-gray-500">
              Final counts: {results.final.users} users, {results.final.growers} growers, {results.final.dispensaries} dispensaries.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
