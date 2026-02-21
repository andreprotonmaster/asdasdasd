import { SkeletonBlock } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton-line w-48 h-6" />
        <div className="skeleton-line w-72" />
      </div>

      {/* Chat area */}
      <SkeletonBlock className="w-full h-[500px]" />
    </div>
  );
}
