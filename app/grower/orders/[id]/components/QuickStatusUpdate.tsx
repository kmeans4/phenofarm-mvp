'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/hooks/useToast';
import { getOrderStatusLabel } from '@/lib/order-workflow';
import { Loader2 } from 'lucide-react';

interface QuickStatusUpdateProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_CONFIG = {
  PENDING: {
    label: getOrderStatusLabel('PENDING'),
    color: 'bg-pf-warning-bg text-pf-warning border-pf-warning-line',
    actions: [
      { status: 'CONFIRMED', label: 'Accept request', color: 'bg-emerald-500 text-[#032116] hover:bg-emerald-400' },
      { status: 'CANCELLED', label: 'Cancel request', color: 'bg-pf-danger-bg text-pf-danger hover:bg-pf-danger-bg/80' },
    ]
  },
  CONFIRMED: {
    label: getOrderStatusLabel('CONFIRMED'),
    color: 'bg-pf-info-bg text-pf-info border-pf-info-line',
    actions: [
      { status: 'PROCESSING', label: 'Start preparing', color: 'bg-pf-purple-bg text-pf-purple ring-1 ring-inset ring-pf-purple-line hover:bg-pf-purple-bg/80' },
      { status: 'CANCELLED', label: 'Cancel request', color: 'bg-pf-danger-bg text-pf-danger hover:bg-pf-danger-bg/80' },
    ]
  },
  PROCESSING: {
    label: getOrderStatusLabel('PROCESSING'),
    color: 'bg-pf-purple-bg text-pf-purple border-pf-purple-line',
    actions: [
      { status: 'SHIPPED', label: 'Mark ready / in transit', color: 'bg-pf-warning-bg text-pf-warning ring-1 ring-inset ring-pf-warning-line hover:bg-pf-warning-bg/80' },
      { status: 'CANCELLED', label: 'Cancel request', color: 'bg-pf-danger-bg text-pf-danger hover:bg-pf-danger-bg/80' },
    ]
  },
  SHIPPED: {
    label: getOrderStatusLabel('SHIPPED'),
    color: 'bg-pf-warning-bg text-pf-warning border-pf-warning-line',
    actions: [
      { status: 'DELIVERED', label: 'Mark delivered', color: 'bg-emerald-500 text-[#032116] hover:bg-emerald-400' },
    ]
  },
  DELIVERED: {
    label: getOrderStatusLabel('DELIVERED'),
    color: 'bg-pf-accent-bg text-pf-accent border-pf-accent-line',
    actions: []
  },
  CANCELLED: {
    label: getOrderStatusLabel('CANCELLED'),
    color: 'bg-pf-danger-bg text-pf-danger border-pf-danger-line',
    actions: []
  },
};

const SUCCESS_MESSAGES: Record<string, string> = {
  CONFIRMED: 'Request accepted',
  PROCESSING: 'Request marked preparing',
  SHIPPED: 'Request marked ready / in transit',
  DELIVERED: 'Request delivered',
  CANCELLED: 'Request cancelled',
};

export default function QuickStatusUpdate({ orderId, currentStatus }: QuickStatusUpdateProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const pendingRef = useRef(false);
  useEffect(() => { pendingRef.current = false; setIsUpdating(false); setShowConfirmation(''); }, [currentStatus]);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState('');
  
  const config = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  
  const handleStatusChange = async (newStatus: string) => {
    if (pendingRef.current) return;
    if (showConfirmation !== newStatus) {
      setShowConfirmation(newStatus);
      return;
    }
    
    pendingRef.current = true;
    setIsUpdating(true);
    setError('');
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update status');
      }
      
      toast.success(SUCCESS_MESSAGES[newStatus] || `Request moved to ${getOrderStatusLabel(newStatus)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      pendingRef.current = false;
      setIsUpdating(false);
    }
  };
  
  if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') return null;
  
  return (
    <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line p-3 sm:p-4">
      <h2 className="mb-2 text-sm sm:mb-3 font-semibold text-pf-text">Next action</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-pf-danger-bg border border-pf-danger-line rounded-lg text-pf-danger text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {config.actions.map((action) => {
          const isConfirming = showConfirmation === action.status;
          const isDestructive = action.status === 'CANCELLED';
          const isActiveUpdate = isUpdating && isConfirming;

          return (
            <button
              key={action.status}
              type="button"
              onClick={() => handleStatusChange(action.status)}
              disabled={isUpdating}
              className={`
                relative min-h-10 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium
                transition-colors disabled:cursor-not-allowed disabled:opacity-50
                ${isDestructive && isConfirming
                  ? 'bg-pf-danger-bg text-pf-danger hover:bg-pf-danger-bg/80 ring-2 ring-pf-danger-line ring-offset-2 ring-offset-pf-surface'
                  : isDestructive ? 'border border-pf-danger-line bg-pf-surface text-pf-danger hover:bg-pf-danger-bg' : `${action.color} ${isConfirming ? 'ring-2 ring-pf-accent-line ring-offset-2 ring-offset-pf-surface' : ''}`}
              `}
            >
              {isActiveUpdate ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Updating...
                </span>
              ) : isConfirming ? (
                `Confirm: ${action.label.toLowerCase()}`
              ) : (
                action.label
              )}
            </button>
          );
        })}
      </div>
      
      {showConfirmation && (
        <button
          type="button"
          onClick={() => setShowConfirmation('')}
          disabled={isUpdating}
          className="mt-2 min-h-10 rounded-md px-2 text-sm text-pf-muted hover:text-pf-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
