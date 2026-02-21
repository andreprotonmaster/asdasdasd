import { SkeletonBlock } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="space-y-2">
        <div className="skeleton-line w-56 h-6" />
        <div className="skeleton-line w-80" />
      </div>
      <SkeletonBlock className="w-full h-[400px]" />
    </div>
  );
}
