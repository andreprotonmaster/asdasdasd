import { SkeletonGrid, SkeletonBlock } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel p-4 space-y-2">
            <div className="skeleton-line w-1/2" />
            <div className="skeleton-line w-full h-5" />
          </div>
        ))}
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonBlock className="w-full h-[300px]" />
          <SkeletonGrid cols={2} count={2} />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="w-full h-[200px]" />
          <SkeletonBlock className="w-full h-[250px]" />
        </div>
      </div>
    </div>
  );
}
