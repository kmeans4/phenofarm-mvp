const paths = new Set(['/', '/help', '/contact', '/legal/privacy', '/legal/cookies', '/legal/terms']);
const origin = 'https://phenoshop.app';
export const beaconToken = '508876561c0f42bebac3c525f93a40b8';

export function isPublicTrafficUrl(value: string) {
  try {
    const url = new URL(value);
    return url.origin === origin && paths.has(url.pathname);
  } catch {
    return false;
  }
}

function referrerOrigin(value: string) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.origin : '';
  } catch {
    return '';
  }
}

// The official SPA beacon can finish a request after navigation. Only forward a
// page-load measurement when both its original page and the current page are public.
export function publicPageLoad(raw: string, current: string): string | null {
  if (raw.length > 65_536 || !isPublicTrafficUrl(current)) return null;
  try {
    const report = JSON.parse(raw);
    if (report?.eventType !== 1 || report.siteToken !== beaconToken ||
        typeof report.location !== 'string' || !isPublicTrafficUrl(report.location)) return null;
    const page = new URL(report.location);
    return JSON.stringify({
      eventType: report.eventType, siteToken: beaconToken, pageloadId: report.pageloadId,
      startTime: report.startTime, nt: report.nt, ntapi: report.ntapi, n: report.n,
      st: report.st, versions: report.versions, location: page.origin + page.pathname,
      referrer: referrerOrigin(report.referrer),
    });
  } catch {
    return null;
  }
}
