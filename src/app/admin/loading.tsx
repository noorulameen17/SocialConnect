export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10">
      <div className="animate-pulse h-8 w-64 bg-gray-200 rounded" />
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-md border bg-white">
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-3" />
              <div className="h-6 w-1/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-40 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-40 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
