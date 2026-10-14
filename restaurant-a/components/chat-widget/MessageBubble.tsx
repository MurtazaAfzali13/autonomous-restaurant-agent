import { CheckCheck, Sparkles } from "lucide-react";
import type { ChatMessage } from "./types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="mx-auto max-w-[85%] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
        {message.content}
      </div>
    );
  }

  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-orange-500/25">
          {message.content}
        </div>
        <span className="flex items-center gap-1 pr-1 text-[11px] text-stone-400">
          {formatTime(message.createdAt)}
          <CheckCheck className="h-3.5 w-3.5 text-orange-500" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </span>
      <div className="flex max-w-[80%] flex-col items-start gap-1">
        <div className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm border border-orange-100 bg-white px-4 py-2.5 text-sm leading-relaxed text-stone-800 shadow-sm shadow-orange-900/5">
          {message.content}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-orange-500 align-middle" />
          )}
        </div>
        <span className="pl-1 text-[11px] text-stone-400">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
