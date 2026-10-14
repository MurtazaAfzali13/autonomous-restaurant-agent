// components/chat-widget/ChatModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, RotateCcw, Info, ShoppingBag, Trash2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { CheckoutConfirmCard } from "./CheckoutConfirmCard";
import { RoomBookingConfirmCard } from "./RoomBookingConfirmCard";
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:pointer-events-none sm:items-end sm:justify-end sm:p-6">

      <button
        aria-label="Close chat"
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm pointer-events-auto sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none"
      />

      <div
        dir="rtl"
        className={`
          relative z-10 flex h-[88vh] w-full flex-col overflow-hidden
          rounded-t-3xl border border-orange-200/70 bg-[#FFF8F0] shadow-2xl shadow-orange-900/25
          pointer-events-auto
          sm:h-[640px] sm:w-96 sm:rounded-3xl sm:border
          transition-all duration-300 ease-out
          ${entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
        `}
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 8%, rgba(251,146,60,0.16), transparent 40%), radial-gradient(circle at 85% 92%, rgba(253,186,116,0.22), transparent 45%)",
        }}
      >
        {/* هدر */}
        <div className="flex items-center justify-between border-b border-orange-100 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#FFF8F0]" />
            </span>
            <p className="text-sm font-semibold text-stone-800">Intelegent Assistant</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowInfo((v) => !v)}
                title="About the assistant"
                className="rounded-lg p-1.5 text-stone-500 transition hover:bg-orange-100 hover:text-orange-700"
              >
                <Info className="h-4 w-4" />
              </button>
              {showInfo && (
                <div className="absolute left-0 top-9 z-20 w-56 rounded-xl border border-orange-100 bg-white p-3 text-xs leading-relaxed text-stone-600 shadow-xl shadow-orange-900/10">
                  I can show you the menu and help you place food orders, as well as find and book available hotel rooms — and I'll keep you updated on the status of each.
                </div>
              )}
            </div>
            <button
              onClick={() => void resetConversation()}
              title="Clear chat"
              className="rounded-lg p-1.5 text-stone-500 transition hover:bg-orange-100 hover:text-orange-700"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="rounded-lg p-1.5 text-stone-500 transition hover:bg-orange-100 hover:text-orange-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* لیست پیام‌ها */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </span>
              <p className="text-sm text-stone-700">Hello! What would you like to order or which room would you like to book?</p>
              <p className="text-xs text-stone-500">You can ask for the menu or search for available rooms on a specific date</p>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {pendingCheckout?.type === "confirm_checkout" && (
            <CheckoutConfirmCard
              data={pendingCheckout}
              disabled={isThinking}
              onConfirm={() => resolveCheckout(true)}
              onCancel={() => resolveCheckout(false)}
            />
          )}

          {pendingCheckout?.type === "confirm_room_booking" && (
            <RoomBookingConfirmCard
              data={pendingCheckout}
              disabled={isThinking}
              onConfirm={() => resolveCheckout(true)}
              onCancel={() => resolveCheckout(false)}
            />
          )}

          {isThinking && <TypingIndicator />}

          {errorText && (
            <div className="mx-auto max-w-[85%] rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
              {errorText}
            </div>
          )}
        </div>

        {/* نوار ورودی */}
        <div className="border-t border-orange-100 bg-[#FFF8F0] p-3">
          {isLimited ? (
            <div className="w-full rounded-xl border border-orange-200 bg-orange-50 py-2.5 text-center text-sm font-medium text-orange-700">
              Daily message limit reached. Please come back tomorrow.
            </div>
          ) : (
            // dir="ltr" فقط روی همین ردیف: ورودی چپ، دکمه‌ی ارسال راست. بقیه‌ی مودال همچنان rtl است.
            <form onSubmit={handleSubmit} dir="ltr" className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                dir="auto"
                placeholder={pendingCheckout ? "Please select from the buttons above" : "Type your message..."}
                disabled={isThinking || !!pendingCheckout}
                className="
                  flex-1 rounded-full border border-orange-200 bg-white px-4 py-2.5
                  text-sm text-stone-800 placeholder:text-stone-400
                  focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500
                  disabled:opacity-50
                "
              />
              <button
                type="submit"
                disabled={!canSend}
                className="
                  flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                  bg-gradient-to-br from-orange-500 to-orange-600 text-white
                  shadow-md shadow-orange-500/30
                  transition hover:brightness-110 disabled:opacity-40
                "
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* اقدامات سریع */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              disabled={isThinking || !!pendingCheckout || isLimited}
              onClick={() => void send("What's in my shopping cart?")}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-white py-2 text-xs text-stone-600 transition hover:bg-orange-50 disabled:opacity-40"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              سبد خرید
            </button>
            <button
              type="button"
              onClick={() => void resetConversation()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-white py-2 text-xs text-stone-600 transition hover:bg-orange-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              clear chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
