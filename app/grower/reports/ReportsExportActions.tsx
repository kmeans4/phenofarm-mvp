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
  monthlyRevenue: MonthlyRevenueRow[];
  topProducts: TopProductRow[];
  topCustomers: TopCustomerRow[];
  recentOrders: RecentOrderRow[];
}

function csvEscape(value: string | number) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export function ReportsExportActions({
  summary,
  monthlyRevenue,
  topProducts,
  topCustomers,
  recentOrders,
}: ReportsExportActionsProps) {
  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['PhenoFarm Grower Report'],
      ['Generated At', new Date().toISOString()],
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phenofarm-grower-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
      <button
        type="button"
        onClick={() => window.print()}
        className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-medium transition-colors"
      >
        Export PDF
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-medium transition-colors"
      >
        Export CSV
      </button>
    </div>
  );
}
