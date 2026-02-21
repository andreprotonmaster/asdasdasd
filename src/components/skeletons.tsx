/** Reusable skeleton primitives for loading states */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton-line ${className}`} />;
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-line w-2/3" />
          <div className="skeleton-line w-1/3" />
        </div>
      </div>
      <div className="skeleton-line w-full" />
      <div className="skeleton-line w-4/5" />
    </div>
  );
}

export function SkeletonGrid({ cols = 3, count = 6 }: { cols?: number; count?: number }) {
  const gridClass =
    cols === 2 ? "grid-cols-1 sm:grid-cols-2" :
    cols === 4 ? "grid-cols-2 md:grid-cols-4" :
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <div className="skeleton-line w-20 h-4" />

      {/* Title */}
      <div className="space-y-2">
        <div className="skeleton-line w-3/4 h-6" />
        <div className="skeleton-line w-1/2" />
      </div>

      {/* Content block */}
      <div className="glass-panel p-6 space-y-4">
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-4/5" />
        <div className="skeleton-line w-3/5" />
      </div>

      {/* Secondary section */}
      <div className="glass-panel p-6 space-y-4">
        <div className="skeleton-line w-1/3 h-4" />
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonListPage({ title }: { title?: string }) {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        {title ? (
          <div className="skeleton-line w-48 h-6" />
        ) : (
          <div className="skeleton-line w-48 h-6" />
        )}
        <div className="skeleton-line w-80" />
      </div>

      {/* Search / filter bar */}
      <div className="skeleton w-full h-10 rounded-lg" />

      {/* Grid */}
      <SkeletonGrid />
    </div>
  );
}
