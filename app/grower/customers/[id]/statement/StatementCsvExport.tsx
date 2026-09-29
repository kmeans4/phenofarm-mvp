'use client';
import { Button } from '@/app/components/ui/Button';
import { buildPdfBlob } from '@/app/grower/reports/ReportsExportActions';
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function StatementCsvExport({
  name,
  rows,
}: {
  name: string;
  rows: string[][];
}) {
  const filename =
    name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-statement';
  const quote = (value: string) =>
    `"${(/^[\s]*[=+@-]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`;
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          download(
            new Blob([rows.map((r) => r.map(quote).join(',')).join('\r\n')], {
              type: 'text/csv;charset=utf-8',
            }),
            filename + '.csv'
          )
        }
      >
        Export CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          download(
            buildPdfBlob([
              `${name} statement`,
              ...rows.map((r) => r.join(' | ')),
            ]),
            filename + '.pdf'
          )
        }
      >
        Export PDF
      </Button>
      <Button type="button" variant="outline" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}
