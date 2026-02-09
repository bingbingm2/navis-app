export default function ProtectedLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-blue-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading your trip...</p>
      </div>
    </div>
  );
}
