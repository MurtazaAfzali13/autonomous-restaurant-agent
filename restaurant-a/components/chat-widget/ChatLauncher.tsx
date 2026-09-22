"use client";

import { Sparkles } from "lucide-react";

export function ChatLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        group fixed bottom-6 left-6 z-40 flex items-center gap-3
        rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-600
        px-5 py-4 text-left shadow-lg shadow-violet-900/30
        transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300
      "
      aria-label="باز کردن چت با دستیار هوشمند"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <Sparkles className="h-4 w-4 text-white" />
        <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-white">دستیار هوشمند</span>
        <span className="text-xs text-white/80">هر سوالی داری بپرس ✨</span>
      </span>
    </button>
  );
}
