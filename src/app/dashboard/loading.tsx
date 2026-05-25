export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="flex-1 p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg" />
              <div className="h-7 bg-gray-100 rounded w-24" />
              <div className="h-3.5 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="h-12 bg-gray-50 border-b border-gray-100" />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="h-4 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
