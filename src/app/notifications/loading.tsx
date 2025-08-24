export default function NotificationsLoading() {
  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
      <ul className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
