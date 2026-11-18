'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { beaconToken, isPublicTrafficUrl, publicPageLoad } from '@/lib/public-traffic';

const collector = 'https://cloudflareinsights.com/cdn-cgi/rum';

function isCollector(value: string | URL) {
  try {
    const url = new URL(value, window.location.origin);
    return url.origin + url.pathname === collector;
  } catch {
    return false;
  }
}

function optedOut() {
  return navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function safeReport(raw: string) {
  const page = document.querySelector<HTMLElement>('[data-public-traffic-page]');
  if (optedOut() || page?.dataset.publicTrafficPage !== window.location.pathname) return null;
  return publicPageLoad(raw, window.location.href);
}

// Cloudflare uses XHR for page loads and sendBeacon during navigation. Leave all
// other requests alone, including the app's accounts, payments and form requests.
function guardCollector() {
  const xhr = XMLHttpRequest.prototype;
  const open = xhr.open;
  const send = xhr.send;
  const reports = new WeakSet<XMLHttpRequest>();
  xhr.open = function (method: string, url: string | URL, async: boolean = true, user?: string | null, password?: string | null) {
    reports.delete(this);
    if (isCollector(url)) reports.add(this);
    return open.call(this, method, url, async, user, password);
  };
  xhr.send = function (body) {
    if (!reports.has(this)) return send.call(this, body);
    const report = typeof body === 'string' && safeReport(body);
    if (report) return send.call(this, report);
  };
  const sendBeacon = navigator.sendBeacon?.bind(navigator);
  if (sendBeacon) {
    navigator.sendBeacon = (url, body) => {
      if (!isCollector(url)) return sendBeacon(url, body);
      const forward = (raw: string) => {
        const report = safeReport(raw);
        if (report) sendBeacon(url, new Blob([report], { type: 'application/json' }));
      };
      if (typeof body === 'string') forward(body);
      else if (body instanceof Blob && body.size <= 65_536) void body.text().then(forward).catch(() => {});
      return true;
    };
  }
}

export function PublicTraffic() {
  const pathname = usePathname();
  useEffect(() => {
    if (optedOut() || !isPublicTrafficUrl(window.location.href) || document.getElementById('public-web-analytics')) return;
    guardCollector();
    const script = document.createElement('script');
    script.id = 'public-web-analytics';
    script.type = 'module';
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.referrerPolicy = 'origin';
    script.dataset.cfBeacon = JSON.stringify({ token: beaconToken });
    document.head.appendChild(script);
  }, [pathname]);
  return <span hidden data-public-traffic-page={pathname} />;
}
