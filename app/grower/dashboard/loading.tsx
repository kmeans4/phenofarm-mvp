import { Skeleton } from "@/app/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <Skeleton className="h-4 w-24 mb-2" />
      <div className="flex items-baseline gap-2 mt-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

function QuickActionSkeleton() {
  return (
    <div className="block p-5 rounded-xl border border-gray-200">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function ChartBarSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <Skeleton className="w-full rounded-t-lg" style={{ height: "60px" }} />
      <Skeleton className="h-3 w-8" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickActionSkeleton />
        <QuickActionSkeleton />
        <QuickActionSkeleton />
      </div>

      {/* Revenue Chart Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="h-64 flex items-end justify-between gap-2 px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <ChartBarSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="px-6 pb-6 space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <ActivityItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
