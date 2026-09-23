'use client';

import { Download } from 'lucide-react';

export function StatementCsvExport({ name, rows }: { name: string; rows: string[][] }) {
  const download = () => { const quote = (value: string) => /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value; const csv = rows.map((row) => row.map(quote).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const link = document.createElement('a'); link.href = url; link.download = `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-statement.csv`; link.click(); URL.revokeObjectURL(url); };
  return <button type="button" onClick={download} className="inline-flex h-10 items-center gap-2 rounded-lg border border-pf-line-strong bg-pf-surface px-4 text-sm font-semibold text-pf-secondary hover:bg-pf-canvas focus-visible:ring-2 focus-visible:ring-pf-accent"><Download className="h-4 w-4" />Export CSV</button>;
}
