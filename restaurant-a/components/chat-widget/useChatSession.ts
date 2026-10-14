// components/chat-widget/useChatSession.ts
"use client";

import { useCallback, useRef, useState } from "react";
import { sendChat, DailyLimitError } from "@/lib/backend-client";
import type { ChatApiResponse, ChatMessage, PendingInterrupt } from "./types";

const TYPEWRITER_MS_PER_CHAR = 12;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type Status = "idle" | "thinking" | "limited" | "error";

// هویت کاربر دیگر از فرانت فرستاده نمی‌شود؛ بک‌اند آن را از JWT می‌خواند.
export function useChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [pendingCheckout, setPendingCheckout] = useState<PendingInterrupt | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const typewriterTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

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

  // فقط نمای چت را پاک می‌کند. سقف روزانه‌ی پیام سمت سرور است و با این دکمه ریست نمی‌شود.
  const resetConversation = useCallback(() => {
    setMessages([]);
    setPendingCheckout(null);
    setErrorText(null);
    setStatus((s) => (s === "limited" ? s : "idle"));
  }, []);

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
