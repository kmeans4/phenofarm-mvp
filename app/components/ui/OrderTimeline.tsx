import { format } from 'date-fns';
import { CheckCircle2, ClipboardList, Flag, Package, Truck, XCircle, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { getOrderStatusLabel } from '@/lib/order-workflow';

type TimelineState = 'complete' | 'current' | 'upcoming' | 'cancelled';

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface OrderTimelineProps {
  currentStatus: string;
  createdAt?: Date | string | null;
  shippedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  title?: string;
  cancelledDescription?: string;
  className?: string;
}

const STATUS_FLOW: TimelineStep[] = [
  { status: 'PENDING', label: getOrderStatusLabel('PENDING'), description: 'Buyer request received', icon: ClipboardList },
  { status: 'CONFIRMED', label: getOrderStatusLabel('CONFIRMED'), description: 'Request accepted by grower', icon: CheckCircle2 },
  { status: 'PROCESSING', label: getOrderStatusLabel('PROCESSING'), description: 'Preparing requested items', icon: Package },
  { status: 'SHIPPED', label: 'Ready', description: 'Ready, picked up, or in transit', icon: Truck },
  { status: 'DELIVERED', label: getOrderStatusLabel('DELIVERED'), description: 'Fulfillment complete', icon: Flag },
];

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getStepState(currentStatus: string, stepStatus: string): TimelineState {
  const currentIndex = STATUS_FLOW.findIndex((step) => step.status === currentStatus);
  const stepIndex = STATUS_FLOW.findIndex((step) => step.status === stepStatus);

  if (currentStatus === 'CANCELLED') return stepStatus === 'PENDING' ? 'complete' : 'cancelled';
  if (currentIndex === -1 || stepIndex === -1) return 'upcoming';
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

function getStepDate(status: string, dates: { createdAt: Date | null; shippedAt: Date | null; deliveredAt: Date | null }) {
  if (status === 'PENDING') return dates.createdAt;
  if (status === 'SHIPPED') return dates.shippedAt;
  if (status === 'DELIVERED') return dates.deliveredAt;
  return null;
}

function formatStepDate(date: Date | null, state: TimelineState) {
  if (date) return format(date, 'MMM d, yyyy h:mm a');
  if (state === 'current') return 'Current step';
  return '';
}

function getStepClasses(state: TimelineState) {
  if (state === 'complete') return 'border-green-600 bg-green-600 text-white';
  if (state === 'current') return 'border-green-600 bg-white text-green-700 ring-4 ring-green-100';
  return 'border-gray-200 bg-gray-50 text-gray-400';
}

function getLabelClasses(state: TimelineState) {
  if (state === 'complete' || state === 'current') return 'text-gray-900';
  return 'text-gray-400';
}

export function OrderTimeline({
  currentStatus,
  createdAt,
  shippedAt,
  deliveredAt,
  title = 'Timeline',
  cancelledDescription = 'This request was cancelled. Message the other party if you need more detail.',
  className = '',
}: OrderTimelineProps) {
  const currentIndex = STATUS_FLOW.findIndex((step) => step.status === currentStatus);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentStep = STATUS_FLOW[effectiveIndex] || STATUS_FLOW[0];
  const dates = {
    createdAt: toDate(createdAt),
    shippedAt: toDate(shippedAt),
    deliveredAt: toDate(deliveredAt),
  };
  const progressWidth = currentStatus === 'CANCELLED'
    ? 0
    : `${(effectiveIndex / (STATUS_FLOW.length - 1)) * 100}%`;

  if (currentStatus === 'CANCELLED') {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-900">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <XCircle className="h-10 w-10 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Request cancelled</p>
              <p className="text-sm text-red-800">{cancelledDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative px-2 sm:px-4">
          <div className="absolute left-5 right-5 top-5 hidden h-0.5 bg-gray-200 sm:block" aria-hidden="true">
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: progressWidth }} />
          </div>

          <ol className="relative grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-3">
            {STATUS_FLOW.map((step) => {
              const state = getStepState(currentStatus, step.status);
              const StepIcon = step.icon;
              const date = getStepDate(step.status, dates);

              return (
                <li key={step.status} aria-current={state === 'current' ? 'step' : undefined} className="flex min-w-0 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                  <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${getStepClasses(state)}`}>
                    <StepIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 sm:w-full">
                    <span className={`block text-sm font-semibold leading-tight sm:text-xs ${getLabelClasses(state)}`}>
                      {step.label}
                    </span>
                    {(date || state === 'current') && <span className="mt-1 block break-words text-[11px] text-gray-500">
                      {formatStepDate(date, state)}
                    </span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="mt-4 text-sm text-gray-600">{currentStep.description}</p>
      </CardContent>
    </Card>
  );
}
