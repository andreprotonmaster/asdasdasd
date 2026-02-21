import { SkeletonBlock } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton-line w-32 h-6" />
        <div className="skeleton-line w-64" />
      </div>

      {/* Live panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonBlock className="w-full h-[300px]" />
        <SkeletonBlock className="w-full h-[300px]" />
      </div>

      {/* Activity feed */}
      <SkeletonBlock className="w-full h-[250px]" />
    </div>
  );
}
