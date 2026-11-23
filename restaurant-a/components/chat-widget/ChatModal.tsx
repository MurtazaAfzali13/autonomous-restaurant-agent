// components/chat-widget/ChatModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, RotateCcw, Info, ShoppingBag, Trash2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { CheckoutConfirmCard } from "./CheckoutConfirmCard";
import { RoomBookingConfirmCard } from "./RoomBookingConfirmCard";
import type { useChatSession } from "./useChatSession";

// File lives at public/images/robot/robot.png (served from /images/robot/robot.png)
const ROBOT_SRC = "/images/robot/robot.png";

interface Props {
  open: boolean;
  onClose: () => void;
  session: ReturnType<typeof useChatSession>;
}

export function ChatModal({ open, onClose, session }: Props) {
  const { messages, status, restoring, pendingCheckout, errorText, send, resolveCheckout, resetConversation } = session;
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
  const isBusy = isThinking || restoring;
  const isLimited = status === "limited";
  const canSend = input.trim().length > 0 && !isBusy && !pendingCheckout && !isLimited;

  const handleClear = () => {
    if (isBusy) return;
    if (messages.length > 0 && !window.confirm("Delete this conversation? Your cart, orders and bookings are not affected.")) return;
    void resetConversation();
  };

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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm pointer-events-auto sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none"
      />

      <div
        dir="ltr"
        lang="en"
        className={`
          relative z-10 flex h-[88vh] w-full flex-col overflow-hidden
          rounded-t-3xl border border-sky-200/80 bg-[#F5FAFF] shadow-2xl shadow-sky-950/20
          pointer-events-auto
          sm:h-[min(720px,calc(100vh_-_3rem))] sm:w-[min(760px,calc(100vw_-_3rem))] sm:rounded-3xl sm:border
          transition-all duration-300 ease-out
          ${entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
        `}
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 8%, rgba(125,211,252,0.22), transparent 42%), radial-gradient(circle at 85% 92%, rgba(147,197,253,0.25), transparent 46%)",
        }}
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-sky-100 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/30">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#F5FAFF]" />
            </span>
            <p className="text-sm font-semibold text-slate-800">Intelligent Assistant</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowInfo((v) => !v)}
                title="About the assistant"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-100 hover:text-sky-700"
              >
                <Info className="h-4 w-4" />
              </button>
              {showInfo && (
                <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-sky-100 bg-white p-3 text-left text-xs leading-relaxed text-slate-600 shadow-xl shadow-sky-900/10">
                  I can show you the menu and help you place food orders, as well as find and book available hotel rooms — and I'll keep you updated on the status of each.
                </div>
              )}
            </div>
            <button
              onClick={handleClear}
              title="Clear chat"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-100 hover:text-sky-700"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-sky-100 hover:text-sky-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat column */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <div ref={scrollRef} className="relative z-10 h-full space-y-4 overflow-y-auto px-4 py-4 md:px-6">
              {messages.length === 0 && !restoring && !isThinking && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ROBOT_SRC}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="pointer-events-none h-auto w-36 select-none drop-shadow-sm sm:w-44"
                  />
                  <p className="text-sm font-medium text-slate-700">Hello! What would you like to order or which room would you like to book?</p>
                  <p className="text-xs text-slate-500">You can ask for the menu or search for available rooms on a specific date</p>
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

              {isBusy && <TypingIndicator />}

              {errorText && (
                <div className="mx-auto max-w-[85%] rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
                  {errorText}
                </div>
              )}
            </div>
          </div>

          {/* Input bar */}
          <div className="border-t border-sky-100 bg-[#F5FAFF] p-3 md:px-6">
            {isLimited ? (
              <div className="w-full rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-center text-sm font-medium text-sky-700">
                Daily message limit reached. Please come back tomorrow.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  dir="ltr"
                  placeholder={pendingCheckout ? "Please select from the buttons above" : "Type your message..."}
                  disabled={isBusy || !!pendingCheckout}
                  className="
                    flex-1 rounded-full border border-sky-200 bg-white px-4 py-2.5
                    text-sm text-slate-800 placeholder:text-slate-400
                    focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500
                    disabled:opacity-50
                  "
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="
                    flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                    bg-gradient-to-br from-sky-500 to-blue-600 text-white
                    shadow-md shadow-sky-500/30
                    transition hover:brightness-110 disabled:opacity-40
                  "
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* Quick actions */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                disabled={isBusy || !!pendingCheckout || isLimited}
                onClick={() => void send("What's in my shopping cart?")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white py-2 text-xs text-slate-600 transition hover:bg-sky-50 disabled:opacity-40"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-sky-600" />
                Shopping cart
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white py-2 text-xs text-slate-600 transition hover:bg-sky-50"
              >
                <Trash2 className="h-3.5 w-3.5 text-sky-600" />
                Clear chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}