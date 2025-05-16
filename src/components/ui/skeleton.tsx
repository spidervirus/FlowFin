import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Skeleton component for loading states
 * @param className - Additional CSS classes to add to the component
 * @param props - Additional HTML attributes to add to the component
 * @returns A skeleton loader component
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
      {...props}
      aria-hidden="true"
      aria-label="Loading"
      role="status"
    />
  );
}

/**
 * Profile avatar skeleton
 * Used for user profile images
 */
export function AvatarSkeleton() {
  return <Skeleton className="h-10 w-10 rounded-full" />;
}

/**
 * Text line skeleton
 * Used for text content
 */
export function TextSkeleton({ width = "w-full" }: { width?: string }) {
  return <Skeleton className={`h-4 ${width}`} />;
}

/**
 * Heading skeleton
 * Used for headings and titles
 */
export function HeadingSkeleton({ width = "w-[250px]" }: { width?: string }) {
  return <Skeleton className={`h-7 ${width}`} />;
}

/**
 * Card skeleton
 * Used for card-like UI elements
 */
export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Dashboard card skeleton
 * Used specifically for dashboard cards with a header and content
 */
export function DashboardCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-[120px]" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton
 * Used for data tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}