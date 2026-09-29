'use client';

import { ChatDrawer } from '@/app/components/messaging/ChatDrawer';

interface PortalFloatingActionsProps {
  currentUserId: string;
  role: 'GROWER' | 'DISPENSARY';
}

export function PortalFloatingActions({
  currentUserId,
  role,
}: PortalFloatingActionsProps) {
  return (
    <div className="pf-portal-fabs">
      <ChatDrawer currentUserId={currentUserId} currentRole={role} />
    </div>
  );
}
