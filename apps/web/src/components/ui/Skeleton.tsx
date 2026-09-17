// =============================================================================
// Loading Skeleton Components
// Consistent loading states across the application.
// =============================================================================

interface SkeletonProps {
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

const ROUNDED_CLASSES = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${ROUNDED_CLASSES[rounded]} ${className}`}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// Card Skeleton
// =============================================================================

export function CampaignCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm" aria-busy="true" aria-label="Loading campaign">
      <Skeleton className="h-40 w-full" rounded="lg" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full" rounded="full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// List Skeleton
// =============================================================================

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-3">
          <Skeleton className="h-10 w-10 shrink-0" rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Table Skeleton
// =============================================================================

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border" aria-busy="true" aria-label="Loading table">
      <div className="bg-gray-50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="border-t p-4">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, col) => (
              <Skeleton key={col} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Profile Skeleton
// =============================================================================

export function ProfileSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm" aria-busy="true" aria-label="Loading profile">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-16 w-16" rounded="full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" rounded="lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12" rounded="lg" />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Hero Skeleton
// =============================================================================

export function HeroSkeleton() {
  return (
    <div className="relative h-[500px] bg-gray-200" aria-busy="true" aria-label="Loading hero">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-2" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Progress Skeleton
// =============================================================================

export function ProgressSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm" aria-busy="true" aria-label="Loading progress">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-20 w-20" rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" rounded="full" />
      <div className="flex justify-between mt-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
