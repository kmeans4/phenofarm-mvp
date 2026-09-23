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
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas ${
          status === 'success'
            ? 'border-pf-accent-line bg-pf-accent-bg text-pf-accent cursor-default'
            : status === 'error'
            ? 'border-pf-danger-line bg-pf-danger-bg text-pf-danger hover:bg-pf-danger-bg/80'
            : 'border-pf-line-strong bg-pf-raised text-pf-text hover:bg-pf-hover'
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
        <div className="rounded-lg border border-pf-line bg-pf-canvas p-3 text-sm">
          {results.checked && (
            <div>
              <p className="font-medium text-pf-text">Checked existing records</p>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-pf-muted">
                <div className="rounded-md bg-pf-surface p-2">
                  <dt>Users</dt>
                  <dd className="mt-1 font-semibold text-pf-text">{results.checked.users}</dd>
                </div>
                <div className="rounded-md bg-pf-surface p-2">
                  <dt>Growers</dt>
                  <dd className="mt-1 font-semibold text-pf-text">{results.checked.growers}</dd>
                </div>
                <div className="rounded-md bg-pf-surface p-2">
                  <dt>Dispensaries</dt>
                  <dd className="mt-1 font-semibold text-pf-text">{results.checked.dispensaries}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-3">
            <p className="font-medium text-pf-text">Created</p>
            {created.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {created.map((account) => (
                  <li key={account} className="flex items-center gap-2 text-pf-accent">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="break-all">{account}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-pf-muted">No new demo accounts were needed.</p>
            )}
          </div>

          {errors.length > 0 && (
            <div className="mt-3 rounded-md border border-pf-danger-line bg-pf-danger-bg p-2">
              <p className="flex items-center gap-2 font-medium text-pf-danger">
                <AlertCircle className="h-4 w-4" />
                Errors
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-pf-danger">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {results.final && (
            <p className="mt-3 text-xs text-pf-muted">
              Final counts: {results.final.users} users, {results.final.growers} growers, {results.final.dispensaries} dispensaries.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
