export function MealGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading meals">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.06)]"
        >
          <div className="h-56 bg-slate-800/50 border-b border-emerald-500/10" />
          <div className="p-5 space-y-3 -mt-6 relative z-10 bg-slate-900/60 backdrop-blur-md rounded-t-3xl border-t border-slate-700/50">
            <div className="h-6 w-3/4 rounded-lg bg-slate-800/80" />
            <div className="h-4 w-full rounded bg-slate-800/50" />
            <div className="h-4 w-5/6 rounded bg-slate-800/50" />
            <div className="flex justify-between items-center pt-4">
              <div className="h-8 w-20 rounded-xl bg-slate-800/60 border border-slate-700/50" />
              <div className="h-10 w-28 rounded-2xl bg-emerald-500/10 border border-emerald-500/20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
