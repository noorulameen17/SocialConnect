export default function ProfileLoading() {
  return (
    <div className="flex w-full min-h-screen">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r bg-white" />
      <main className="flex-1 px-6 py-10">
        <div className="animate-pulse space-y-6 max-w-xl">
          <div className="h-8 w-1/2 bg-gray-200 rounded" />
          <div className="h-40 w-full bg-gray-200 rounded" />
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
