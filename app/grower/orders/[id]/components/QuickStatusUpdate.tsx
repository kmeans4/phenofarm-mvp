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
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    actions: [
      { status: 'CONFIRMED', label: 'Accept request', color: 'bg-green-700 hover:bg-green-800' },
      { status: 'CANCELLED', label: 'Cancel request', color: 'bg-red-600 hover:bg-red-700' },
    ]
  },
  CONFIRMED: {
    label: getOrderStatusLabel('CONFIRMED'),
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    actions: [
      { status: 'PROCESSING', label: 'Start preparing', color: 'bg-purple-600 hover:bg-purple-700' },
      { status: 'CANCELLED', label: 'Cancel request', color: 'bg-red-600 hover:bg-red-700' },
    ]
  },
  PROCESSING: {
    label: getOrderStatusLabel('PROCESSING'),
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    actions: [
      { status: 'SHIPPED', label: 'Mark ready / in transit', color: 'bg-orange-600 hover:bg-orange-700' },
      { status: 'CANCELLED', label: 'Cancel request', color: 'bg-red-600 hover:bg-red-700' },
    ]
  },
  SHIPPED: {
    label: getOrderStatusLabel('SHIPPED'),
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    actions: [
      { status: 'DELIVERED', label: 'Mark delivered', color: 'bg-green-600 hover:bg-green-700' },
    ]
  },
  DELIVERED: {
    label: getOrderStatusLabel('DELIVERED'),
    color: 'bg-green-100 text-green-800 border-green-200',
    actions: []
  },
  CANCELLED: {
    label: getOrderStatusLabel('CANCELLED'),
    color: 'bg-red-100 text-red-800 border-red-200',
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <h2 className="mb-2 text-sm sm:mb-3 font-semibold text-gray-900">Next action</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
                  ? 'bg-red-700 text-white hover:bg-red-800 ring-2 ring-red-300 ring-offset-2'
                  : isDestructive ? 'border border-red-200 bg-white text-red-700 hover:bg-red-50' : `${action.color} text-white ${isConfirming ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}
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
          className="mt-2 min-h-10 rounded-md px-2 text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
