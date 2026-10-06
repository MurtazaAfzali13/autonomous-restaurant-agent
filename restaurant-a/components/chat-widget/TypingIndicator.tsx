// components/chat-widget/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      {/* Avatar with rotating gradient ring — main loading indicator */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <span
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #818cf8 35%, #a78bfa 60%, transparent 100%)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
        />
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
      </div>

      {/* Changed rounded-br-sm to rounded-bl-sm for LTR layout */}
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-800 bg-slate-900 px-4 py-3.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
      </div>
    </div>
  );
}