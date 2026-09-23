'use client';

import { useEffect } from 'react';

const OVERLAY_COUNT_ATTRIBUTE = 'data-phenofarm-overlay-count';

export function useBodyOverlay(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    const currentCount = Number(body.getAttribute(OVERLAY_COUNT_ATTRIBUTE) || '0');
    body.setAttribute(OVERLAY_COUNT_ATTRIBUTE, String(currentCount + 1));
    body.setAttribute('data-overlay-open', 'true');

    return () => {
      const nextCount = Math.max(0, Number(body.getAttribute(OVERLAY_COUNT_ATTRIBUTE) || '1') - 1);
      if (nextCount === 0) {
        body.removeAttribute(OVERLAY_COUNT_ATTRIBUTE);
        body.removeAttribute('data-overlay-open');
      } else {
        body.setAttribute(OVERLAY_COUNT_ATTRIBUTE, String(nextCount));
      }
    };
  }, [active]);
}
