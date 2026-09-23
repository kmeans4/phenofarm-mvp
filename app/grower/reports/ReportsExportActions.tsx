'use client';

interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  activeCustomers: number;
  avgOrderValue: number;
}

interface MonthlyRevenueRow {
  month: string;
  revenue: number;
}

interface TopProductRow {
  productName: string;
  quantity: number;
  revenue: number;
}

interface TopCustomerRow {
  dispensaryName: string;
  orderCount: number;
  revenue: number;
}

interface RecentOrderRow {
  orderId: string;
  customer: string;
  status: string;
  date: string;
  totalAmount: number;
}

interface ReportsExportActionsProps {
  summary: ReportSummary;
  rangeLabel: string;
  monthlyRevenue: MonthlyRevenueRow[];
  topProducts: TopProductRow[];
  topCustomers: TopCustomerRow[];
  recentOrders: RecentOrderRow[];
}

function csvEscape(value: string | number) {
  const raw = String(value ?? '');
  const text = typeof value === 'string' && /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

function pdfEscape(value: string | number) {
  return String(value ?? '')
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfLine(value: string, maxLength = 92) {
  const words = value.split(' ');
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function buildPdfBlob(lines: string[]) {
  const pageLineLimit = 48;
  const pages: string[][] = [];

  lines.forEach((line) => {
    wrapPdfLine(line).forEach((wrappedLine) => {
      const currentPage = pages[pages.length - 1];
      if (!currentPage || currentPage.length >= pageLineLimit) {
        pages.push([wrappedLine]);
      } else {
        currentPage.push(wrappedLine);
      }
    });
  });

  const objects: string[] = [];
  const fontObjectId = 3;
  const pageObjectIds: number[] = [];

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((pageLines, index) => {
    const pageObjectId = 4 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);

    const text = [
      'BT',
      '/F1 10 Tf',
      '48 744 Td',
      '14 TL',
      ...pageLines.map((line) => `(${pdfEscape(line)}) Tj T*`),
      'ET',
    ].join('\n');

    objects[contentObjectId - 1] = `<< /Length ${text.length} >>\nstream\n${text}\nendstream`;
    objects[pageObjectId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeRangeSlug(rangeLabel: string) {
  return rangeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'range';
}

export function ReportsExportActions({
  summary,
  rangeLabel,
  monthlyRevenue,
  topProducts,
  topCustomers,
  recentOrders,
}: ReportsExportActionsProps) {
  const filenameDate = new Date().toISOString().slice(0, 10);
  const filenameRange = safeRangeSlug(rangeLabel);

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['PhenoFarm Grower Report'],
      ['Generated At', new Date().toISOString()],
      ['Date Range', rangeLabel],
      [],
      ['Summary'],
      ['Metric', 'Value'],
      ['Delivered Request Value', summary.totalRevenue.toFixed(2)],
      ['Total Requests', summary.totalOrders],
      ['Active Requests', summary.activeOrders],
      ['Active Customers', summary.activeCustomers],
      ['Average Delivered Value', summary.avgOrderValue.toFixed(2)],
      [],
      ['Monthly Delivered Request Value'],
      ['Month', 'Estimated Value'],
      ...monthlyRevenue.map((row) => [row.month, row.revenue.toFixed(2)]),
      [],
      ['Top Products'],
      ['Product', 'Quantity', 'Estimated Value'],
      ...topProducts.map((row) => [row.productName, row.quantity, row.revenue.toFixed(2)]),
      [],
      ['Top Customers'],
      ['Customer', 'Requests', 'Estimated Value'],
      ...topCustomers.map((row) => [row.dispensaryName, row.orderCount, row.revenue.toFixed(2)]),
      [],
      ['Recent Requests'],
      ['Request ID', 'Customer', 'Status', 'Date', 'Estimated Value'],
      ...recentOrders.map((row) => [
        row.orderId,
        row.customer,
        row.status,
        row.date,
        row.totalAmount.toFixed(2),
      ]),
    ];

    const blob = new Blob([rowsToCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `phenofarm-grower-report-${filenameRange}-${filenameDate}.csv`);
  };

  const exportPdf = () => {
    const lines = [
      'PhenoFarm Grower Report',
      `Generated At: ${new Date().toLocaleString()}`,
      `Date Range: ${rangeLabel}`,
      '',
      'Summary',
      `Delivered Request Value: $${summary.totalRevenue.toFixed(2)}`,
      `Total Requests: ${summary.totalOrders}`,
      `Active Requests: ${summary.activeOrders}`,
      `Active Customers: ${summary.activeCustomers}`,
      `Average Delivered Value: $${summary.avgOrderValue.toFixed(2)}`,
      '',
      'Monthly Delivered Request Value',
      ...(monthlyRevenue.length > 0
        ? monthlyRevenue.map((row) => `${row.month}: $${row.revenue.toFixed(2)}`)
        : ['No delivered request value in this range.']),
      '',
      'Top Products',
      ...(topProducts.length > 0
        ? topProducts.map((row, index) => `${index + 1}. ${row.productName} - ${row.quantity} units - $${row.revenue.toFixed(2)}`)
        : ['No delivered product value in this range.']),
      '',
      'Top Customers',
      ...(topCustomers.length > 0
        ? topCustomers.map((row, index) => `${index + 1}. ${row.dispensaryName} - ${row.orderCount} requests - $${row.revenue.toFixed(2)}`)
        : ['No delivered customer value in this range.']),
      '',
      'Recent Requests',
      ...(recentOrders.length > 0
        ? recentOrders.map((row) => `${row.orderId} - ${row.customer} - ${row.status} - ${row.date} - $${row.totalAmount.toFixed(2)}`)
        : ['No requests in this range.']),
    ];

    downloadBlob(buildPdfBlob(lines), `phenofarm-grower-report-${filenameRange}-${filenameDate}.pdf`);
  };

  return (
    <div className="flex flex-col gap-1 sm:items-end">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={exportPdf}
          aria-label="Export PDF"
          className="min-h-10 rounded-lg bg-pf-raised px-3 py-2 text-xs font-medium text-pf-text transition-colors hover:bg-pf-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
        >
          PDF
        </button>
        <button
          type="button"
          onClick={exportCsv}
          aria-label="Export CSV"
          className="min-h-10 rounded-lg bg-pf-raised px-3 py-2 text-xs font-medium text-pf-text transition-colors hover:bg-pf-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
        >
          CSV
        </button>
      </div>
    </div>
  );
}
