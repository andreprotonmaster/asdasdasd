import { SkeletonBlock } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton-line w-40 h-6" />
        <div className="skeleton-line w-72" />
      </div>

      {/* Globe placeholder */}
      <SkeletonBlock className="w-full h-[500px] rounded-xl" />

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel p-3 space-y-2">
            <div className="skeleton-line w-1/2" />
            <div className="skeleton-line w-full h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
