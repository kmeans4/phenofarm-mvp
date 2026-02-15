'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuickStatusUpdateProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    actions: [
      { status: 'CONFIRMED', label: 'Confirm Order', color: 'bg-blue-600 hover:bg-blue-700' },
      { status: 'CANCELLED', label: 'Cancel Order', color: 'bg-red-600 hover:bg-red-700' },
    ]
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    actions: [
      { status: 'PROCESSING', label: 'Start Processing', color: 'bg-purple-600 hover:bg-purple-700' },
      { status: 'CANCELLED', label: 'Cancel Order', color: 'bg-red-600 hover:bg-red-700' },
    ]
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    actions: [
      { status: 'SHIPPED', label: 'Mark Shipped', color: 'bg-orange-600 hover:bg-orange-700' },
      { status: 'CANCELLED', label: 'Cancel Order', color: 'bg-red-600 hover:bg-red-700' },
    ]
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    actions: [
      { status: 'DELIVERED', label: 'Mark Delivered', color: 'bg-green-600 hover:bg-green-700' },
    ]
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-200',
    actions: []
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    actions: []
  },
};

export default function QuickStatusUpdate({ orderId, currentStatus }: QuickStatusUpdateProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState('');
  
  const config = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  
  const handleStatusChange = async (newStatus: string) => {
    if (showConfirmation !== newStatus) {
      setShowConfirmation(newStatus);
      return;
    }
    
    setIsUpdating(true);
    setError('');
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }
      
      router.refresh();
      setShowConfirmation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') {
    return (
      <div className={`rounded-lg border p-4 ${config.color}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {currentStatus === 'DELIVERED' ? '✅' : '❌'}
          </span>
          <div>
            <p className="font-medium">Order {config.label}</p>
            <p className="text-sm opacity-75">
              {currentStatus === 'DELIVERED' 
                ? 'This order has been completed successfully.' 
                : 'This order has been cancelled and cannot be modified.'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Update Status</h3>
          <p className="text-xs sm:text-sm text-gray-600">Quick actions to move order forward</p>
        </div>
        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border self-start ${config.color}`}>
          {config.label}
        </span>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        {config.actions.map((action) => (
          <button
            key={action.status}
            onClick={() => handleStatusChange(action.status)}
            disabled={isUpdating}
            className={`
              relative px-3 sm:px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-medium
              transition-colors disabled:opacity-50 whitespace-nowrap
              ${action.color}
              ${showConfirmation === action.status ? 'ring-2 ring-offset-2 ring-gray-400' : ''}
            `}
          >
            {isUpdating && showConfirmation === action.status ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : showConfirmation === action.status ? (
              `Click to confirm ${action.label}`
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>
      
      {showConfirmation && (
        <button
          onClick={() => setShowConfirmation('')}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
