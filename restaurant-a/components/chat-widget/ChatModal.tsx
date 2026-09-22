"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, RotateCcw, Info, ShoppingBag, Trash2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { CheckoutConfirmCard } from "./CheckoutConfirmCard";
import type { useChatSession } from "./useChatSession";

interface Props {
  open: boolean;
  onClose: () => void;
  session: ReturnType<typeof useChatSession>;
}

export function ChatModal({ open, onClose, session }: Props) {
  const { messages, status, pendingCheckout, errorText, send, resolveCheckout, resetConversation } = session;
  const [input, setInput] = useState("");
  const [entered, setEntered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // جلوه‌ی ورود مودال: یک فریم بعد از mount شدن، به حالت نهایی transition می‌کند
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingCheckout]);

  if (!open) return null;

  const isThinking = status === "thinking";
  const isLimited = status === "limited";
  const canSend = input.trim().length > 0 && !isThinking && !pendingCheckout && !isLimited;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const text = input;
    setInput("");
    void send(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start p-0 sm:items-center sm:justify-center sm:p-6">
      <button
        aria-label="بستن چت"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        dir="rtl"
        className={`
          relative z-10 flex h-[88vh] w-full flex-col overflow-hidden
          rounded-t-3xl border border-white/10 bg-[#0b0b16] shadow-2xl shadow-black/60
          sm:h-[660px] sm:max-w-sm sm:rounded-3xl
          transition-all duration-300 ease-out
          ${entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
        `}
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 8%, rgba(129,140,248,0.12), transparent 40%), radial-gradient(circle at 85% 92%, rgba(167,139,250,0.10), transparent 45%)",
        }}
      >
        {/* هدر */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-violet-950/40">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0b16]" />
            </span>
            <p className="text-sm font-semibold text-white">دستیار هوشمند</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowInfo((v) => !v)}
                title="درباره‌ی دستیار"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <Info className="h-4 w-4" />
              </button>
              {showInfo && (
                <div className="absolute left-0 top-9 z-20 w-56 rounded-xl border border-white/10 bg-slate-900 p-3 text-xs leading-relaxed text-slate-300 shadow-xl">
                  می‌توانم منو را نشان دهم، سفارش ثبت کنم، وضعیت سفارش را بگویم و در صورت نیاز سفارش را لغو کنم.
                </div>
              )}
            </div>
            <button
              onClick={() => void resetConversation()}
              title="گفتگوی جدید"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="بستن"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* لیست پیام‌ها */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/20">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </span>
              <p className="text-sm text-slate-300">سلام! چه غذایی امروز میل دارید؟</p>
              <p className="text-xs text-slate-600">می‌توانید منو بپرسید یا مستقیم سفارش بدهید</p>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {pendingCheckout && (
            <CheckoutConfirmCard
              data={pendingCheckout}
              disabled={isThinking}
              onConfirm={() => resolveCheckout(true)}
              onCancel={() => resolveCheckout(false)}
            />
          )}

          {isThinking && <TypingIndicator />}

          {errorText && (
            <div className="mx-auto max-w-[85%] rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
              {errorText}
            </div>
          )}
        </div>

        {/* نوار ورودی */}
        <div className="border-t border-white/5 bg-[#0b0b16] p-3">
          {isLimited ? (
            <button
              type="button"
              onClick={() => void resetConversation()}
              className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              شروع گفتگوی جدید
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={pendingCheckout ? "لطفاً از دکمه‌های بالا انتخاب کنید" : "پیامتان را بنویسید..."}
                disabled={isThinking || !!pendingCheckout}
                className="
                  flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5
                  text-sm text-slate-100 placeholder:text-slate-500
                  focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500
                  disabled:opacity-50
                "
              />
              <button
                type="submit"
                disabled={!canSend}
                className="
                  flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                  bg-gradient-to-br from-indigo-500 to-violet-600 text-white
                  shadow-md shadow-violet-950/40
                  transition hover:brightness-110 disabled:opacity-40
                "
                aria-label="ارسال پیام"
              >
                <Send className="h-4 w-4 -rotate-180" />
              </button>
            </form>
          )}

          {/* اقدامات سریع */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              disabled={isThinking || !!pendingCheckout || isLimited}
              onClick={() => void send("سبد خریدم چیه؟")}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              سبد خرید
            </button>
            <button
              type="button"
              onClick={() => void resetConversation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-slate-300 transition hover:bg-white/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              پاک کردن گفتگو
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
