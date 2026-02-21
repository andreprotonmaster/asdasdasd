import { SkeletonBlock } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton-line w-72 h-6" />
        <div className="skeleton-line w-96" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-panel p-3 space-y-2">
            <div className="skeleton w-4 h-4 rounded" />
            <div className="skeleton-line w-1/2 h-5" />
            <div className="skeleton-line w-2/3" />
          </div>
        ))}
      </div>

      {/* Timeline */}
      <SkeletonBlock className="w-full h-[400px]" />

      {/* Vehicle grid */}
      <SkeletonBlock className="w-full h-[300px]" />
    </div>
  );
}
