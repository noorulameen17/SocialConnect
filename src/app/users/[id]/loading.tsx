export default function UserProfileLoading() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div className="space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}
