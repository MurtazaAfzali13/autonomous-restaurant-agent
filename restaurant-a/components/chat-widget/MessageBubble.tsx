import { CheckCheck, Sparkles } from "lucide-react";
import type { ChatMessage } from "./types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="mx-auto max-w-[85%] rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-300">
        {message.content}
      </div>
    );
  }

  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-violet-950/30">
          {message.content}
        </div>
        <span className="flex items-center gap-1 pl-1 text-[11px] text-slate-500">
          {formatTime(message.createdAt)}
          <CheckCheck className="h-3.5 w-3.5 text-violet-400" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </span>
      <div className="flex max-w-[80%] flex-col items-start gap-1">
        <div className="whitespace-pre-wrap break-words rounded-2xl rounded-br-sm border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm leading-relaxed text-slate-100">
          {message.content}
          {message.isStreaming && (
            <span className="mr-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-violet-400 align-middle" />
          )}
        </div>
        <span className="pr-1 text-[11px] text-slate-500">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
