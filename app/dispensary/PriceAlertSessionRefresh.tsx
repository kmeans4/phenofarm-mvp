'use client';

import { useEffect } from 'react';
import { refreshSessionPriceAlerts } from './refresh-price-alerts';

export function PriceAlertSessionRefresh({ userId }: { userId: string }) {
  useEffect(() => {
    void refreshSessionPriceAlerts(userId).catch(() => { /* The alerts page can retry and display the failure. */ });
  }, [userId]);
  return null;
}
