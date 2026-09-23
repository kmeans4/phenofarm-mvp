'use client';

import { ChatDrawer } from '@/app/components/messaging/ChatDrawer';
import { RecentActivityDrawer } from '@/app/components/ux/RecentActivityDrawer';

interface PortalFloatingActionsProps {
  currentUserId: string;
  role: 'GROWER' | 'DISPENSARY';
}

export function PortalFloatingActions({ currentUserId, role }: PortalFloatingActionsProps) {
  return (
    <div className="pf-portal-fabs fixed bottom-3 right-3 z-[65] flex flex-col items-end gap-2 transition-opacity duration-150">
      <RecentActivityDrawer role={role} />
      <ChatDrawer currentUserId={currentUserId} currentRole={role} />
    </div>
  );
}
