export const LAB_REPORT_LABELS = {
  cannabinoids: 'Potency',
  pesticides: 'Pesticides',
  microbials: 'Microbials',
  coa: 'COA',
} as const;

export type LabReportKey = keyof typeof LAB_REPORT_LABELS;
export const LAB_REPORT_KEYS = Object.keys(LAB_REPORT_LABELS) as LabReportKey[];

export function normalizeLabReports(value: unknown): LabReportKey[] {
  return Array.isArray(value) ? LAB_REPORT_KEYS.filter(key => value.includes(key)) : [];
}

export function labReportDownloadPath(productId: string, report: LabReportKey) {
  return `/api/dispensary/products/${encodeURIComponent(productId)}/labs/${report}`;
}
