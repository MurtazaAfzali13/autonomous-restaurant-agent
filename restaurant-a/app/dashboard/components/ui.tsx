// app/dashboard/components/ui.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export const COLORS = {
  emerald: '#10b981',
  mint: '#34d399',
  sky: '#38bdf8',
  blue: '#3b82f6',
  violet: '#a78bfa',
  fuchsia: '#e879f9',
  amber: '#fbbf24',
  orange: '#fb923c',
  rose: '#fb7185',
  slate: '#94a3b8',
};

export const PALETTE = [
  COLORS.emerald,
  COLORS.sky,
  COLORS.violet,
  COLORS.amber,
  COLORS.fuchsia,
  COLORS.rose,
  COLORS.orange,
];

export const GRID = 'rgba(148,163,184,0.10)';
export const TICK = '#8b9bb4';

export const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface GlassCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GlassCard({
  title,
  subtitle,
  icon: Icon,
  accent = COLORS.emerald,
  right,
  children,
  className = '',
}: GlassCardProps) {
  return (
    <section
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/80 via-[#0a1020]/80 to-slate-950/90 p-4 backdrop-blur-xl ${className}`}
      style={{ boxShadow: `0 0 0 1px ${accent}12, 0 24px 60px -32px ${accent}66` }}
    >
      {/* top accent line */}
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      {/* corner glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-35"
        style={{ background: accent }}
      />
      <header className="relative mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{
                color: accent,
                borderColor: `${accent}40`,
                background: `linear-gradient(135deg, ${accent}26, ${accent}08)`,
                boxShadow: `0 0 18px -4px ${accent}80`,
              }}
            >
              <Icon size={15} />
            </span>
          )}
          <div>
            <h2 className="text-sm font-bold leading-tight text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {right}
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  prefix?: string;
  suffix?: string;
}

export function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 shadow-2xl backdrop-blur-xl">
      {label !== undefined && <p className="mb-1 text-[11px] text-slate-400">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.payload?.color || p.payload?.fill, boxShadow: `0 0 8px ${p.color || p.payload?.color}` }}
          />
          <span className="text-slate-300">{p.name}</span>
          <span className="ml-3 font-bold text-white">
            {prefix}
            {Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
