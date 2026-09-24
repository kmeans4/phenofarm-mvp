import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.MONITORING_ENABLED !== 'true') return;
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_MAIL_FROM || (process.env.MONITORING_TOKEN?.length || 0) < 32) throw new Error('Production monitoring is not fully configured');
  const { scheduleServerError, isReportingError } = await import('@/lib/operational-monitoring');
  const state = globalThis as typeof globalThis & { phenoErrorCaptureInstalled?: boolean };
  if (state.phenoErrorCaptureInstalled) return;
  state.phenoErrorCaptureInstalled = true;
  const original = console.error.bind(console);
  // Existing handled API failures log through console.error. Capture only the
  // occurrence; original diagnostics remain exclusively in provider logs.
  console.error = (...args: unknown[]) => { original(...args); if (!isReportingError()) scheduleServerError(); };
}

export const onRequestError: Instrumentation.onRequestError = async () => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { recordServerError } = await import('@/lib/operational-monitoring');
  await recordServerError();
};
