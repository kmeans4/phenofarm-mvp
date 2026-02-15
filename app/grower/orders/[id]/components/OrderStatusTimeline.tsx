'use client';

import { useState } from 'react';

interface StatusStep {
  status: string;
  label: string;
  description: string;
  icon: string;
}

const STATUS_FLOW: StatusStep[] = [
  { status: 'PENDING', label: 'Pending', description: 'Order received', icon: '📋' },
  { status: 'CONFIRMED', label: 'Confirmed', description: 'Payment confirmed', icon: '✅' },
  { status: 'PROCESSING', label: 'Processing', description: 'Preparing order', icon: '📦' },
  { status: 'SHIPPED', label: 'Shipped', description: 'In transit', icon: '🚚' },
  { status: 'DELIVERED', label: 'Delivered', description: 'Order complete', icon: '🎉' },
];

interface OrderStatusTimelineProps {
  currentStatus: string;
  orderId: string;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  onStatusChange?: (newStatus: string) => void;
}

export default function OrderStatusTimeline({ 
  currentStatus, 
  orderId,
  shippedAt,
  deliveredAt,
  onStatusChange 
}: OrderStatusTimelineProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const currentIndex = STATUS_FLOW.findIndex(s => s.status === currentStatus);
  
  // Handle CANCELLED or unknown status
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;
  
  const getStatusTextColor = (index: number) => {
    if (currentStatus === 'CANCELLED') return index === effectiveIndex ? 'text-red-600' : 'text-gray-400';
    if (index <= effectiveIndex) return 'text-green-700';
    return 'text-gray-400';
  };
  
  const getNextStatus = () => {
    if (currentStatus === 'CANCELLED') return null;
    const nextIndex = effectiveIndex + 1;
    if (nextIndex < STATUS_FLOW.length) {
      return STATUS_FLOW[nextIndex];
    }
    return null;
  };
  
  const getPrevStatus = () => {
    if (currentStatus === 'CANCELLED') return null;
    if (effectiveIndex > 0) {
      return STATUS_FLOW[effectiveIndex - 1];
    }
    return null;
  };
  
  const handleStatusUpdate = async (newStatus: string) => {
    if (!onStatusChange) return;
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const nextStatus = getNextStatus();
  const prevStatus = getPrevStatus();
  
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">❌</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Order Cancelled</h3>
            <p className="text-red-600">This order has been cancelled and cannot be modified.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Order Progress</h2>
        <p className="text-sm text-gray-600">Order #{orderId}</p>
      </div>
      
      {/* Timeline */}
      <div className="relative px-2 sm:px-4">
        {/* Progress line container */}
        <div className="absolute top-4 left-4 right-4 h-0.5 sm:h-1 bg-gray-200 sm:top-6">
          <div 
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${(effectiveIndex / (STATUS_FLOW.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {STATUS_FLOW.map((step, index) => (
            <div key={step.status} className="flex flex-col items-center">
              <div className={`
                relative z-10 w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-xl
                border-2 sm:border-4 transition-all duration-300 bg-white
                ${index <= currentIndex 
                  ? 'border-green-500' 
                  : 'border-gray-300 bg-gray-50'}
              `}>
                <span className={index <= currentIndex ? 'grayscale-0' : 'grayscale opacity-50'}>
                  {step.icon}
                </span>
              </div>
              <div className="mt-2 sm:mt-3 text-center w-12 sm:w-16">
                <p className={`text-[10px] sm:text-xs font-medium leading-tight ${getStatusTextColor(index)}`}>
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Status Info */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl flex-shrink-0">{STATUS_FLOW[effectiveIndex]?.icon || '📋'}</span>
          <div className="min-w-0 flex-1">
            <p className={`font-medium text-sm sm:text-base ${currentStatus === 'CANCELLED' ? 'text-red-800' : 'text-green-800'}`}>
              Currently: {STATUS_FLOW[effectiveIndex]?.label || currentStatus}
            </p>
            <p className={`text-xs sm:text-sm ${currentStatus === 'CANCELLED' ? 'text-red-600' : 'text-green-600'}`}>
              {currentStatus === 'SHIPPED' && shippedAt 
                ? `Shipped on ${new Date(shippedAt).toLocaleDateString()}`
                : currentStatus === 'DELIVERED' && deliveredAt
                ? `Delivered on ${new Date(deliveredAt).toLocaleDateString()}`
                : STATUS_FLOW[effectiveIndex]?.description || ''
              }
            </p>
          </div>
          
          {currentStatus === 'DELIVERED' && (
            <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
              Complete ✓
            </span>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      {onStatusChange && currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
          {prevStatus && effectiveIndex > 0 && (
            <button
              onClick={() => handleStatusUpdate(prevStatus.status)}
              disabled={isUpdating}
              className="px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium disabled:opacity-50"
            >
              ← Back
            </button>
          )}
          
          {nextStatus && (
            <button
              onClick={() => handleStatusUpdate(nextStatus.status)}
              disabled={isUpdating}
              className="px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
            >
              Mark as {nextStatus.label}
              {isUpdating && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </button>
          )}
          
          <button
            onClick={() => handleStatusUpdate('CANCELLED')}
            disabled={isUpdating}
            className="ml-auto px-3 py-1.5 sm:py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-xs font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* Status History */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Status History</h3>
        <div className="space-y-2">
          {STATUS_FLOW.slice(0, effectiveIndex + 1).reverse().map((step, idx) => (
            <div key={step.status} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-gray-600">
                {idx === 0 ? 'Current' : 'Completed'}: {step.label}
              </span>
              {step.status === 'SHIPPED' && shippedAt && (
                <span className="text-gray-400 text-xs">
                  {new Date(shippedAt).toLocaleString()}
                </span>
              )}
              {step.status === 'DELIVERED' && deliveredAt && (
                <span className="text-gray-400 text-xs">
                  {new Date(deliveredAt).toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
