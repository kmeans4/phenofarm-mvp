'use client';

import { useEffect } from 'react';

export function PriceAlertSessionRefresh() {
  useEffect(() => {
    const key = 'phenofarm-price-alerts-refreshed';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, new Date().toISOString());
    void fetch('/api/dispensary/price-alerts/refresh', { method: 'POST' });
  }, []);
  return null;
}
