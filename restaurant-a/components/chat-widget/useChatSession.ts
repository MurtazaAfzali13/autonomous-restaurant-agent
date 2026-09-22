"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ChatApiResponse,
  ChatMessage,
  ChatUser,
  CheckoutInterruptData,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://127.0.0.1:8000";

// سرعت جلوه‌ی تایپ‌شوندگی (میلی‌ثانیه بین هر کاراکتر). بک‌اند استریم واقعی ندارد،
// این فقط حس تولید زنده را شبیه‌سازی می‌کند بعد از رسیدن جواب کامل.
const TYPEWRITER_MS_PER_CHAR = 12;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type Status = "idle" | "thinking" | "limited" | "error";

export function useChatSession(user: ChatUser) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [pendingCheckout, setPendingCheckout] = useState<CheckoutInterruptData | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const typewriterTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  /** جواب دستیار را کاراکتر به کاراکتر آشکار می‌کند تا حس استریم بدهد */
  const streamAssistantText = useCallback((fullText: string) => {
    const id = uid();
    appendMessage({ id, role: "assistant", content: "", isStreaming: true, createdAt: Date.now() });

    let i = 0;
    if (typewriterTimer.current) clearInterval(typewriterTimer.current);
    typewriterTimer.current = setInterval(() => {
      i += 1;
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: fullText.slice(0, i) } : m))
      );
      if (i >= fullText.length) {
        if (typewriterTimer.current) clearInterval(typewriterTimer.current);
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)));
      }
    }, TYPEWRITER_MS_PER_CHAR);
  }, [appendMessage]);

  const handleApiResponse = useCallback(
    (data: ChatApiResponse) => {
      if (data.type === "interrupt") {
        // نقطه‌ی HITL: گراف متوقف شده، باید کارت تایید نشان داده شود نه یک پیام معمولی
        setPendingCheckout(data.data);
        streamAssistantText(data.data.question);
      } else {
        setPendingCheckout(null);
        streamAssistantText(data.content);
      }
    },
    [streamAssistantText]
  );

  const send = useCallback(
    async (text: string, resume = false) => {
      if (!text.trim()) return;
      setErrorText(null);

      if (!resume) {
        appendMessage({ id: uid(), role: "user", content: text, createdAt: Date.now() });
      }
      setStatus("thinking");

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            customer_name: user.name,
            customer_email: user.email,
            message: text,
            resume,
          }),
        });

        if (res.status === 429) {
          setStatus("limited");
          appendMessage({
            id: uid(),
            role: "system",
            content: "سقف پیام این گفتگو تمام شده. برای ادامه، گفتگوی جدید شروع کنید.",
            createdAt: Date.now(),
          });
          return;
        }

        if (!res.ok) {
          throw new Error(`خطای سرور (${res.status})`);
        }

        const data: ChatApiResponse = await res.json();
        handleApiResponse(data);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setErrorText(err instanceof Error ? err.message : "ارتباط با سرور برقرار نشد.");
      }
    },
    [appendMessage, handleApiResponse, user]
  );

  /** کاربر روی «تایید و ثبت سفارش» یا «انصراف» کلیک کرده — پاسخ HITL */
  const resolveCheckout = useCallback(
    (confirmed: boolean) => {
      const answer = confirmed ? "بله" : "خیر";
      appendMessage({
        id: uid(),
        role: "user",
        content: confirmed ? "✅ تایید می‌کنم، ثبت شود" : "❌ انصراف",
        createdAt: Date.now(),
      });
      setPendingCheckout(null);
      void send(answer, true);
    },
    [appendMessage, send]
  );

  const resetConversation = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/chat/reset?thread_id=${user.id}`, { method: "POST" });
    } catch {
      // اگر ریست سمت سرور fail شود هم اجازه بده کاربر از نو شروع کند
    }
    setMessages([]);
    setPendingCheckout(null);
    setErrorText(null);
    setStatus("idle");
  }, [user.id]);

  return {
    messages,
    status,
    pendingCheckout,
    errorText,
    send,
    resolveCheckout,
    resetConversation,
  };
}
