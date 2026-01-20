export function AlbumCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-neutral-200 dark:bg-neutral-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-12" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-16" />
        </div>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
      </div>
    </div>
  );
}

export function AlbumGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AlbumCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TracklistSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800 animate-pulse"
        >
          <div className="flex items-baseline gap-4 flex-1">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-8" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-48" />
          </div>
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-12" />
        </div>
      ))}
    </div>
  );
}

export function AlbumHeaderSkeleton() {
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-12 items-start animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="w-full aspect-square bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="space-y-2">
          <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
        <div className="flex gap-3">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-16" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-24" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
          <div className="flex gap-2">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VersionsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-neutral-200 dark:border-neutral-700 p-4 rounded animate-pulse"
        >
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-40" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
