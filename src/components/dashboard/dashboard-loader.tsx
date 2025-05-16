"use client";

import { 
  Skeleton, 
  HeadingSkeleton, 
  DashboardCardSkeleton, 
  TableSkeleton 
} from "@/components/ui/skeleton";

export function DashboardLoader() {
  return (
    <div 
      className="w-full py-6 space-y-8" 
      role="status" 
      aria-label="Loading dashboard"
    >
      {/* Dashboard header */}
      <div className="px-6 flex flex-col gap-2">
        <HeadingSkeleton width="w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>

      {/* Stats cards */}
      <div className="px-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>

      {/* Chart section */}
      <div className="px-6 py-2">
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <HeadingSkeleton width="w-[150px]" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-[250px] w-full rounded-md" />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-6 py-2">
        <div className="rounded-lg border p-4">
          <div className="mb-4">
            <HeadingSkeleton width="w-[200px]" />
          </div>
          <TableSkeleton rows={5} />
        </div>
      </div>

      {/* Bottom cards */}
      <div className="px-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-4">
          <HeadingSkeleton width="w-[180px]" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-2 items-center">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border p-4 space-y-4">
          <HeadingSkeleton width="w-[150px]" />
          <Skeleton className="h-[180px] w-full rounded-md" />
        </div>
      </div>

      <div className="sr-only">Loading dashboard content, please wait...</div>
    </div>
  );
}

export function DashboardCardLoader() {
  return <DashboardCardSkeleton />;
}

export function DashboardTableLoader() {
  return (
    <div className="space-y-4">
      <HeadingSkeleton width="w-[200px]" />
      <TableSkeleton rows={10} />
    </div>
  );
}