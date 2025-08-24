export default function NewPostLoading() {
  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4 animate-pulse">
        <div className="h-24 w-full bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
