"use client";

import { normalizeOrderStatus, OrderStatus } from "@/lib/order-types";
import { cn } from "@/lib/utils";

const STEPS: {
  key: OrderStatus;
  label: string;
  shortLabel: string;
  dot: string;
  glow: string;
  line: string;
}[] = [
  {
    key: "pending",
    label: "Pending",
    shortLabel: "Pending",
    dot: "bg-amber-400 border-amber-300",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.55)]",
    line: "from-amber-500/80",
  },
  {
    key: "cooking",
    label: "Cooking",
    shortLabel: "Preparing",
    dot: "bg-cyan-400 border-cyan-300",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.55)]",
    line: "from-cyan-500/80",
  },
  {
    key: "delivered",
    label: "Completed",
    shortLabel: "Done",
    dot: "bg-emerald-400 border-emerald-300",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.55)]",
    line: "from-emerald-500/80",
  },
];

function stepIndex(status: OrderStatus): number {
  if (status === "cooking") return 1;
  if (status === "delivered") return 2;
  return 0;
}

export function OrderStatusTimeline({
  status,
  className = "",
  compact = false,
}: {
  status: string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const normalized = normalizeOrderStatus(status);
  const activeIndex = stepIndex(normalized);
  const progressPercent = activeIndex === 0 ? 0 : activeIndex === 1 ? 50 : 100;

  return (
    <div className={cn("w-full", className)} aria-label="Order status progress">
      <div className="relative pt-2 pb-1">
        <div
          className="absolute top-[1.15rem] left-[10%] right-[10%] h-1 rounded-full bg-slate-800 overflow-hidden"
          aria-hidden
        >
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r to-emerald-500/70 transition-all duration-700 ease-out",
              activeIndex >= 1 ? "from-amber-500/70 via-cyan-500/70" : "from-amber-500/40"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ol className="relative flex justify-between items-start">
          {STEPS.map((step, index) => {
            const isComplete = index < activeIndex;
            const isActive = index === activeIndex;
            const isUpcoming = index > activeIndex;

            return (
              <li key={step.key} className="flex flex-col items-center flex-1 z-10">
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                    step.dot,
                    isUpcoming && "opacity-35 scale-90 border-slate-600 bg-slate-800",
                    (isActive || isComplete) && step.glow,
                    isActive && "scale-110 ring-2 ring-white/10"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs font-black",
                      isUpcoming ? "text-slate-500" : "text-slate-950"
                    )}
                  >
                    {index + 1}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-center font-bold uppercase tracking-wider transition-colors duration-500",
                    compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs",
                    isActive && step.key === "pending" && "text-amber-300",
                    isActive && step.key === "cooking" && "text-cyan-300",
                    isActive && step.key === "delivered" && "text-emerald-300",
                    isComplete && "text-slate-400",
                    isUpcoming && "text-slate-600"
                  )}
                >
                  {compact ? step.shortLabel : step.label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
