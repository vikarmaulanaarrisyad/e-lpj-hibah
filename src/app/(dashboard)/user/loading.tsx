export default function UserLoading() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col antialiased relative overflow-x-hidden selection:bg-emerald-500/20">
      {/* 1. ULTRA-SLEEK TOP INDETERMINATE PROGRESS BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-slate-900 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 shadow-[0_0_14px_rgba(16,185,129,0.9)] animate-top-bar" />
      </div>

      {/* 2. AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 -z-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 -z-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 3. UNIVERSAL TOP HEADER (GLASSMORPHIC NAVBAR SKELETON) */}
      <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-slate-800 border border-emerald-500/30 flex items-center justify-center relative shimmer-card">
              <div className="w-5 h-5 rounded bg-emerald-400/40" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-28 h-4 bg-slate-700/80 rounded-md shimmer-pill" />
                <div className="w-20 h-4 bg-emerald-500/20 border border-emerald-500/30 rounded-full shimmer-pill" />
              </div>
              <div className="w-48 sm:w-64 h-3 bg-slate-800 rounded shimmer-pill" />
            </div>
          </div>

          {/* Central Live Loading Pulse Badge */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium text-emerald-400">Memuat Workspace...</span>
            <span className="text-slate-500">•</span>
            <span className="text-[11px] text-slate-400">Sinkronisasi Data Real-Time</span>
          </div>

          {/* Right Navigation & Profile Shortcuts */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-8 rounded-lg bg-slate-800/60 border border-slate-700/40 shimmer-pill" />
              ))}
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 shimmer-card" />
          </div>
        </div>
      </header>

      {/* 4. WORKFLOW STEPPER INDICATOR SKELETON */}
      <div className="w-full bg-slate-900/40 border-b border-slate-800/60 py-3 px-4 sm:px-8">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {["RAB & Pagu", "Buku Kas (BKU)", "Surat Pesanan", "BAST Serah Terima", "Dokumentasi"].map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  idx === 0 
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
                    : "bg-slate-800/40 border-slate-700/40 text-slate-400"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-slate-700/70 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="hidden sm:inline">{step}</span>
                </div>
                {idx < 4 && <div className="w-4 h-[1px] bg-slate-800" />}
              </div>
            ))}
          </div>
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="font-mono text-[11px] text-slate-400">T.A. 2026</span>
          </div>
        </div>
      </div>

      {/* 5. MAIN WORKSPACE SKELETON (DUAL-PANE LAYOUT: FORM & LIVE PAPER CANVAS) */}
      <main className="max-w-[1720px] mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT PANE: FORM BUILDER SKELETON (7 COLS ON XL) */}
        <section className="xl:col-span-6 2xl:col-span-6 flex flex-col gap-6">
          {/* Card 1: Header Form & Metadata Input */}
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shimmer-card flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-6 rounded-full bg-emerald-500/80" />
                <div className="w-44 h-5 bg-slate-700/80 rounded shimmer-pill" />
              </div>
              <div className="w-24 h-6 bg-slate-800 rounded-full shimmer-pill" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-24 h-3.5 bg-slate-700/60 rounded shimmer-pill" />
                <div className="h-10 rounded-xl bg-slate-800/70 border border-slate-700/50 shimmer-pill" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-28 h-3.5 bg-slate-700/60 rounded shimmer-pill" />
                <div className="h-10 rounded-xl bg-slate-800/70 border border-slate-700/50 shimmer-pill" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-36 h-3.5 bg-slate-700/60 rounded shimmer-pill" />
              <div className="h-10 rounded-xl bg-slate-800/70 border border-slate-700/50 shimmer-pill" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-32 h-3.5 bg-slate-700/60 rounded shimmer-pill" />
              <div className="h-20 rounded-xl bg-slate-800/50 border border-slate-700/40 shimmer-pill" />
            </div>
          </div>

          {/* Card 2: Items / Breakdown Table Skeleton */}
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shimmer-card flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-5 rounded-full bg-amber-500/80" />
                <div className="w-48 h-4 bg-slate-700/80 rounded shimmer-pill" />
              </div>
              <div className="w-28 h-7 bg-emerald-600/20 border border-emerald-500/30 rounded-lg shimmer-pill" />
            </div>

            {/* Simulated Table Lines */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
              <div className="h-9 bg-slate-800/80 border-b border-slate-700/60 flex items-center px-4 gap-4">
                <div className="w-8 h-3 bg-slate-600 rounded shimmer-pill" />
                <div className="w-48 h-3 bg-slate-600 rounded shimmer-pill" />
                <div className="w-20 h-3 bg-slate-600 rounded shimmer-pill ml-auto" />
                <div className="w-24 h-3 bg-slate-600 rounded shimmer-pill" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 border-b border-slate-800/80 flex items-center px-4 gap-4">
                  <div className="w-6 h-3 bg-slate-700/50 rounded" />
                  <div className="w-40 h-3.5 bg-slate-700/60 rounded" />
                  <div className="w-16 h-3 bg-slate-700/50 rounded ml-auto" />
                  <div className="w-24 h-3.5 bg-emerald-500/30 rounded" />
                </div>
              ))}
            </div>

            {/* Summary Bar */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="w-32 h-4 bg-slate-700/70 rounded shimmer-pill" />
              <div className="w-36 h-5 bg-emerald-400/40 rounded shimmer-pill" />
            </div>
          </div>

          {/* Card 3: Action Buttons Skeleton */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-11 rounded-xl bg-emerald-600/30 border border-emerald-500/40 shimmer-card" />
            <div className="w-32 h-11 rounded-xl bg-slate-800 border border-slate-700/60 shimmer-card" />
          </div>
        </section>

        {/* RIGHT PANE: AUTHENTIC F4 PAPER CANVAS SKELETON (6 COLS ON XL) */}
        <section className="xl:col-span-6 2xl:col-span-6 flex flex-col items-center justify-start">
          <div className="w-full max-w-[620px] aspect-[215/330] bg-[#0F172A] border-2 border-slate-700/70 rounded-2xl shadow-2xl p-7 sm:p-9 flex flex-col justify-between shimmer-card ring-1 ring-white/10 relative overflow-hidden">
            {/* Top Paper Header / Authentic Kop Surat Skeleton */}
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 pb-3 border-b-2 border-slate-700">
                {/* Logo Kiri */}
                <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700/70 shrink-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30" />
                </div>
                {/* Teks Kop Surat */}
                <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                  <div className="w-52 h-3.5 bg-slate-600/80 rounded" />
                  <div className="w-64 h-4 bg-slate-500 rounded font-bold" />
                  <div className="w-72 h-2.5 bg-slate-700/80 rounded" />
                </div>
                {/* Logo Kanan / Placeholder */}
                <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700/70 shrink-0 hidden sm:block" />
              </div>

              {/* Judul Dokumen & Nomor */}
              <div className="flex flex-col items-center gap-2 my-2">
                <div className="w-48 h-5 bg-slate-600 rounded font-bold" />
                <div className="w-56 h-3 bg-slate-700/80 rounded" />
              </div>

              {/* Paragraf Pembuka Dokumen */}
              <div className="flex flex-col gap-2 my-2">
                <div className="w-full h-2.5 bg-slate-700/50 rounded" />
                <div className="w-11/12 h-2.5 bg-slate-700/50 rounded" />
                <div className="w-4/5 h-2.5 bg-slate-700/50 rounded" />
              </div>

              {/* Tabel Lembar Cetak */}
              <div className="border border-slate-700 rounded-lg overflow-hidden my-3">
                <div className="h-7 bg-slate-800 border-b border-slate-700 flex items-center px-3 gap-2">
                  <div className="w-6 h-2 bg-slate-600 rounded" />
                  <div className="w-32 h-2 bg-slate-600 rounded" />
                  <div className="w-16 h-2 bg-slate-600 rounded ml-auto" />
                  <div className="w-20 h-2 bg-slate-600 rounded" />
                </div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 border-b border-slate-800/80 flex items-center px-3 gap-2">
                    <div className="w-4 h-2 bg-slate-700/60 rounded" />
                    <div className="w-28 h-2 bg-slate-700/60 rounded" />
                    <div className="w-12 h-2 bg-slate-700/60 rounded ml-auto" />
                    <div className="w-16 h-2 bg-slate-700/60 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Signatures Area Skeleton */}
            <div className="w-full pt-4 border-t border-slate-800 grid grid-cols-2 gap-6">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-28 h-2.5 bg-slate-700 rounded" />
                <div className="w-20 h-2 bg-slate-800 rounded" />
                <div className="w-20 h-16 my-1 border border-dashed border-slate-700/60 rounded flex items-center justify-center text-[10px] text-slate-600 font-mono">
                  [STEMPEL]
                </div>
                <div className="w-32 h-3 bg-slate-600 rounded mt-1 font-bold underline" />
                <div className="w-24 h-2 bg-slate-700/70 rounded" />
              </div>

              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-28 h-2.5 bg-slate-700 rounded" />
                <div className="w-20 h-2 bg-slate-800 rounded" />
                <div className="w-20 h-16 my-1 border border-dashed border-slate-700/60 rounded flex items-center justify-center text-[10px] text-slate-600 font-mono">
                  [MATERAI]
                </div>
                <div className="w-32 h-3 bg-slate-600 rounded mt-1 font-bold underline" />
                <div className="w-24 h-2 bg-slate-700/70 rounded" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. FLOATING LIVE STATUS TOAST (BOTTOM-RIGHT) */}
      <aside className="fixed bottom-6 right-6 z-40 bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3.5 max-w-sm ring-1 ring-emerald-500/20">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        </div>
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-slate-200">
            Menyiapkan Formulir &amp; Dokumen...
          </p>
          <p className="text-[11px] text-emerald-400/90 font-mono">
            Memuat kalkulasi anggaran dan blanko F4
          </p>
        </div>
      </aside>
    </div>
  );
}
