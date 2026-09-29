import { Skeleton } from '@/app/components/ui/skeleton';
export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-label="Loading overview">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-11 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((x) => (
          <Skeleton key={x} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-52 w-full" />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
