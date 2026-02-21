import { SkeletonCard, SkeletonBlock } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton-line w-40 h-6" />
        <div className="skeleton-line w-80" />
      </div>

      {/* Stats strip */}
      <SkeletonBlock className="w-full h-10 rounded-lg" />

      {/* Feed items */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
