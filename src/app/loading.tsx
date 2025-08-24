export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center">
      <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-gray-900 animate-spin" aria-label="Loading" />
      <p className="text-sm text-gray-600">Loading SocialConnect...</p>
    </div>
  );
}
