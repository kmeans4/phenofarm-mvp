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
  
  const getStatusTextColor = (index: number) => {
    if (index <= currentIndex) return 'text-green-700';
    return 'text-gray-400';
  };
  
  const getNextStatus = () => {
    if (currentStatus === 'CANCELLED') return null;
    const nextIndex = currentIndex + 1;
    if (nextIndex < STATUS_FLOW.length) {
      return STATUS_FLOW[nextIndex];
    }
    return null;
  };
  
  const getPrevStatus = () => {
    if (currentStatus === 'CANCELLED') return null;
    if (currentIndex > 0) {
      return STATUS_FLOW[currentIndex - 1];
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
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
        <div 
          className="absolute top-6 left-0 h-1 bg-green-500 -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentIndex / (STATUS_FLOW.length - 1)) * 100}%` }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {STATUS_FLOW.map((step, index) => (
            <div key={step.status} className="flex flex-col items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl
                border-4 transition-all duration-300
                ${index <= currentIndex 
                  ? 'border-green-500 bg-white' 
                  : 'border-gray-300 bg-gray-100'}
              `}>
                <span className={index <= currentIndex ? 'grayscale-0' : 'grayscale'}>
                  {step.icon}
                </span>
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${getStatusTextColor(index)}`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Status Info */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{STATUS_FLOW[currentIndex]?.icon}</span>
            <div>
              <p className="font-medium text-green-800">
                Currently: {STATUS_FLOW[currentIndex]?.label}
              </p>
              <p className="text-sm text-green-600">
                {currentStatus === 'SHIPPED' && shippedAt 
                  ? `Shipped on ${new Date(shippedAt).toLocaleDateString()}`
                  : currentStatus === 'DELIVERED' && deliveredAt
                  ? `Delivered on ${new Date(deliveredAt).toLocaleDateString()}`
                  : STATUS_FLOW[currentIndex]?.description
                }
              </p>
            </div>
          </div>
          
          {currentStatus === 'DELIVERED' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Complete ✓
            </span>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      {onStatusChange && currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
        <div className="mt-6 flex flex-wrap gap-3">
          {prevStatus && currentIndex > 0 && (
            <button
              onClick={() => handleStatusUpdate(prevStatus.status)}
              disabled={isUpdating}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium disabled:opacity-50"
            >
              ← Back to {prevStatus.label}
            </button>
          )}
          
          {nextStatus && (
            <button
              onClick={() => handleStatusUpdate(nextStatus.status)}
              disabled={isUpdating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
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
            className="ml-auto px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium disabled:opacity-50"
          >
            Cancel Order
          </button>
        </div>
      )}
      
      {/* Status History */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Status History</h3>
        <div className="space-y-2">
          {STATUS_FLOW.slice(0, currentIndex + 1).reverse().map((step, idx) => (
            <div key={step.status} className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500" />
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
