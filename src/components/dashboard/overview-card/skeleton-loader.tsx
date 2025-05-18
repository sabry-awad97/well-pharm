// Skeleton Loader structure
const SkeletonLoader = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="bg-muted h-8 w-8 rounded-md" />
        <div className="bg-muted h-8 w-28 rounded-md" />
        <div className="bg-muted h-8 w-8 rounded-md" />
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-muted h-8 w-20 rounded-md" />
        <div className="bg-muted h-8 w-16 rounded-md" />
      </div>
    </div>
    <div className="bg-muted h-[240px] w-full rounded-md px-2" />
    <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
      <div className="space-y-1">
        <div className="bg-muted h-4 w-24 rounded" />
        <div className="bg-muted h-6 w-16 rounded" />
      </div>
      <div className="space-y-1">
        <div className="bg-muted h-4 w-24 rounded" />
        <div className="bg-muted h-6 w-16 rounded" />
      </div>
      <div className="space-y-1">
        <div className="bg-muted h-4 w-24 rounded" />
        <div className="bg-muted h-6 w-16 rounded" />
      </div>
      <div className="space-y-1">
        <div className="bg-muted h-4 w-24 rounded" />
        <div className="bg-muted h-6 w-16 rounded" />
      </div>
    </div>
  </div>
);

export default SkeletonLoader;
