import { getOrderStatusLabel } from '@/lib/order-workflow';
import { CheckCircle2, ClipboardList, Flag, Package, Truck, XCircle, type LucideIcon } from 'lucide-react';

interface StatusStep {
  status: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const STATUS_FLOW: StatusStep[] = [
  { status: 'PENDING', label: getOrderStatusLabel('PENDING'), description: 'Buyer request received', icon: ClipboardList },
  { status: 'CONFIRMED', label: getOrderStatusLabel('CONFIRMED'), description: 'Request accepted by grower', icon: CheckCircle2 },
  { status: 'PROCESSING', label: getOrderStatusLabel('PROCESSING'), description: 'Preparing requested items', icon: Package },
  { status: 'SHIPPED', label: getOrderStatusLabel('SHIPPED'), description: 'Ready, picked up, or in transit', icon: Truck },
  { status: 'DELIVERED', label: getOrderStatusLabel('DELIVERED'), description: 'Fulfillment complete', icon: Flag },
];

interface OrderStatusTimelineProps {
  currentStatus: string;
  orderId: string;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}

export default function OrderStatusTimeline({
  currentStatus,
  orderId,
  shippedAt,
  deliveredAt
}: OrderStatusTimelineProps) {

  const currentIndex = STATUS_FLOW.findIndex(s => s.status === currentStatus);

  // Handle CANCELLED or unknown status
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

  const getStatusTextColor = (index: number) => {
    if (currentStatus === 'CANCELLED') return index === effectiveIndex ? 'text-pf-danger' : 'text-pf-muted';
    if (index <= effectiveIndex) return 'text-pf-accent';
    return 'text-pf-muted';
  };

  const CurrentIcon = STATUS_FLOW[effectiveIndex]?.icon || ClipboardList;

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-pf-danger-bg border border-pf-danger-line rounded-lg p-6">
        <div className="flex items-center gap-3">
          <XCircle className="h-10 w-10 text-pf-danger" />
          <div>
            <h3 className="text-lg font-semibold text-pf-danger">Request Cancelled</h3>
            <p className="text-pf-danger">This order request has been cancelled and cannot be modified.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pf-surface rounded-lg shadow-sm border border-pf-line p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-pf-text">Fulfillment Progress</h2>
        <p className="text-sm text-pf-muted">Order request #{orderId}</p>
      </div>

      {/* Timeline */}
      <div className="relative px-2 sm:px-4">
        {/* Progress line container */}
        <div className="absolute left-5 right-5 top-5 h-0.5 bg-pf-raised">
          <div
            className="h-full bg-pf-accent transition-all duration-500"
            style={{ width: `${(effectiveIndex / (STATUS_FLOW.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STATUS_FLOW.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < effectiveIndex;
            const isCurrent = index === effectiveIndex;
            return (
              <div key={step.status} className="flex flex-col items-center">
                <div className={`
                  relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                  ${isCompleted
                    ? 'border-pf-accent bg-emerald-500 text-[#032116]'
                    : isCurrent
                      ? 'border-pf-accent bg-pf-surface text-pf-accent ring-4 ring-pf-accent-line'
                      : 'border-pf-line bg-pf-canvas text-pf-muted'}
                `}>
                  <StepIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-2 sm:mt-3 text-center w-12 sm:w-16">
                  <p className={`text-[10px] sm:text-xs font-medium leading-tight ${getStatusTextColor(index)}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Info */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-pf-accent-bg border border-pf-accent-line rounded-lg">
        <div className="flex items-center gap-3">
          <CurrentIcon className="h-5 w-5 flex-shrink-0 text-pf-accent sm:h-6 sm:w-6" />
          <div className="min-w-0 flex-1">
            <p className={`font-medium text-sm sm:text-base ${currentStatus === 'CANCELLED' ? 'text-pf-danger' : 'text-pf-accent'}`}>
              Currently: {STATUS_FLOW[effectiveIndex]?.label || currentStatus}
            </p>
            <p className={`text-xs sm:text-sm ${currentStatus === 'CANCELLED' ? 'text-pf-danger' : 'text-pf-accent'}`}>
              {currentStatus === 'SHIPPED' && shippedAt
                ? `Shipped on ${new Date(shippedAt).toLocaleDateString()}`
                : currentStatus === 'DELIVERED' && deliveredAt
                ? `Delivered on ${new Date(deliveredAt).toLocaleDateString()}`
                : STATUS_FLOW[effectiveIndex]?.description || ''
              }
            </p>
          </div>

          {currentStatus === 'DELIVERED' && (
            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-pf-accent-bg text-pf-accent rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </span>
          )}
        </div>
      </div>

      {/* Status History */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-pf-line">
        <h3 className="text-xs sm:text-sm font-medium text-pf-text mb-2 sm:mb-3">Status History</h3>
        <div className="space-y-2">
          {STATUS_FLOW.slice(0, effectiveIndex + 1).reverse().map((step, idx) => (
            <div key={step.status} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-pf-accent flex-shrink-0" />
              <span className="text-pf-muted">
                {idx === 0 ? 'Current' : 'Completed'}: {step.label}
              </span>
              {step.status === 'SHIPPED' && shippedAt && (
                <span className="text-pf-muted text-xs">
                  {new Date(shippedAt).toLocaleString()}
                </span>
              )}
              {step.status === 'DELIVERED' && deliveredAt && (
                <span className="text-pf-muted text-xs">
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
