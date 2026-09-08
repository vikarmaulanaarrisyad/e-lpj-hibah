export default function UserLoading() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased animate-fade-in">
      {/* Top Navbar Skeleton */}
      <div className="h-16 sm:h-20 w-full bg-slate-900/95 border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="w-32 h-4 bg-slate-800 rounded animate-pulse" />
            <div className="w-48 h-3 bg-slate-800/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-20 h-7 bg-slate-800/60 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
        </div>
      </div>

      {/* Breadcrumb / Sub-bar skeleton */}
      <div className="w-full bg-slate-900/60 border-b border-slate-800/80 py-2.5 px-4 sm:px-8">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500/30 rounded-full animate-ping" />
            <span className="text-xs font-medium text-emerald-400">Memuat data halaman...</span>
          </div>
          <div className="w-36 h-4 bg-slate-800/60 rounded animate-pulse" />
        </div>
      </div>

      {/* Main Workspace Skeleton */}
      <main className="max-w-[1720px] mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Form Skeleton */}
        <div className="xl:col-span-6 flex flex-col gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
            <div className="w-44 h-5 bg-slate-800 rounded-md animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
            </div>
            <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
            <div className="h-24 bg-slate-800/40 rounded-xl animate-pulse" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3 shadow-sm">
            <div className="w-36 h-4 bg-slate-800 rounded-md animate-pulse" />
            <div className="h-36 bg-slate-800/30 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Right Preview Skeleton */}
        <div className="xl:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[650px] aspect-[215/330] bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-pulse">
            <div className="w-full h-16 border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="w-12 h-12 bg-slate-800 rounded-lg" />
              <div className="flex-1 px-4 flex flex-col gap-1.5 items-center">
                <div className="w-48 h-3.5 bg-slate-800 rounded" />
                <div className="w-64 h-3 bg-slate-800/60 rounded" />
              </div>
              <div className="w-12 h-12 bg-slate-800 rounded-lg" />
            </div>
            <div className="w-3/4 mx-auto h-4 bg-slate-800 rounded mt-2" />
            <div className="w-1/2 mx-auto h-3 bg-slate-800/60 rounded" />
            <div className="flex-1 bg-slate-950/40 rounded-xl border border-slate-800/50 mt-4 p-4 flex flex-col gap-3">
              <div className="w-full h-8 bg-slate-800/30 rounded" />
              <div className="w-full h-8 bg-slate-800/30 rounded" />
              <div className="w-full h-8 bg-slate-800/30 rounded" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
