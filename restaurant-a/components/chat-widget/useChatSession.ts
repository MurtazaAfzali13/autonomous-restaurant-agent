// components/chat-widget/useChatSession.ts
"use client";

import { useCallback, useRef, useState } from "react";
import { sendChat, fetchHistory, deleteHistory, DailyLimitError } from "@/lib/backend-client";
import type { ChatApiResponse, ChatCard, ChatMessage, PendingInterrupt } from "./types";

const TYPEWRITER_MS_PER_CHAR = 12;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type Status = "idle" | "thinking" | "limited" | "error";

// هویت کاربر دیگر از فرانت فرستاده نمی‌شود؛ بک‌اند آن را از JWT می‌خواند.
export function useChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [restoring, setRestoring] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<PendingInterrupt | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const typewriterTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredRef = useRef(false);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const streamAssistantText = useCallback((fullText: string, cards?: ChatCard[]) => {
    const id = uid();
    appendMessage({ id, role: "assistant", content: "", cards, isStreaming: true, createdAt: Date.now() });

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
        setPendingCheckout(data.data);
        streamAssistantText(data.data.question, data.cards);
      } else {
        setPendingCheckout(null);
        streamAssistantText(data.content, data.cards);
      }
    },
    [streamAssistantText]
  );

  /** گفتگوی ذخیره‌شده‌ی سرور را برمی‌گرداند (فقط یک بار؛ اگر شکست بخورد دفعه‌ی بعد دوباره تلاش می‌شود). */
  const restore = useCallback(async () => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    setRestoring(true);
    try {
      const h = await fetchHistory();
      setMessages(
        h.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          cards: m.cards?.length ? m.cards : undefined,
          createdAt: 0, // زمان واقعی پیام‌های قدیمی ذخیره نشده؛ نمایش داده نمی‌شود
        }))
      );
      setPendingCheckout(h.pending);
      if (h.remaining <= 0) setStatus("limited");
    } catch (err) {
      restoredRef.current = false;
      if (!(err instanceof Error && err.message === "NOT_LOGGED_IN")) {
        setErrorText("Couldn't load your previous conversation.");
      }
    } finally {
      setRestoring(false);
    }
  }, []);

  const send = useCallback(
    async (text: string, resume = false) => {
      if (!text.trim()) return;
      setErrorText(null);

      if (!resume) {
        appendMessage({ id: uid(), role: "user", content: text, createdAt: Date.now() });
      }
      setStatus("thinking");

      try {
        const data = (await sendChat(text, resume)) as ChatApiResponse;
        handleApiResponse(data);
        window.dispatchEvent(new Event("cart:refresh"));
        setStatus("idle");
      } catch (err) {
        if (err instanceof DailyLimitError) {
          setStatus("limited");
          appendMessage({
            id: uid(),
            role: "system",
            content: "You've reached today's message limit. Please come back tomorrow.",
            createdAt: Date.now(),
          });
          return;
        }
        setStatus("error");
        if (err instanceof Error && err.message === "NOT_LOGGED_IN") {
          setErrorText("Please log in to use the assistant.");
        } else {
          setErrorText(err instanceof Error ? err.message : "Could not connect to the server.");
        }
      }
    },
    [appendMessage, handleApiResponse]
  );

  const resolveCheckout = useCallback(
    (confirmed: boolean) => {
      const answer = confirmed ? "yes" : "no";
      appendMessage({
        id: uid(),
        role: "user",
        content: confirmed ? "✅ I confirm" : "❌ Cancel",
        createdAt: Date.now(),
      });
      setPendingCheckout(null);
      void send(answer, true);
    },
    [appendMessage, send]
  );

  /** گفتگوی جدید: حافظه‌ی چت روی سرور پاک می‌شود. سقف روزانه‌ی پیام ریست نمی‌شود. */
  const resetConversation = useCallback(async () => {
    try {
      await deleteHistory();
    } catch {
      setErrorText("Couldn't clear the conversation. Please try again.");
      return;
    }
    if (typewriterTimer.current) clearInterval(typewriterTimer.current);
    setMessages([]);
    setPendingCheckout(null);
    setErrorText(null);
    setStatus((s) => (s === "limited" ? s : "idle"));
  }, []);

  return {
    messages,
    status,
    restoring,
    pendingCheckout,
    errorText,
    send,
    restore,
    resolveCheckout,
    resetConversation,
  };
}
