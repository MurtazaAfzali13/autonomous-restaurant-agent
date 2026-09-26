// app/dashboard/components/DateRangeTabs.tsx
'use client';

import { Calendar } from 'lucide-react';
import { RANGE_LABELS, type RangeKey } from '@/lib/dashboard-stats';

export default function DateRangeTabs({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 mb-8">
      <span className="flex items-center gap-2 text-sm text-slate-400 font-semibold shrink-0">
        <Calendar className="w-4 h-4 text-emerald-400" />
        Date Filter:
      </span>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
              value === key
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {RANGE_LABELS[key]}
          </button>
        ))}
      </div>

      <span className="ml-auto text-xs text-slate-500 hidden sm:block">
        {new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
    </div>
  );
}
