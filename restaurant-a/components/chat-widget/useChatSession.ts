// components/chat-widget/useChatSession.ts
"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ChatApiResponse,
  ChatMessage,
  ChatUser,
  PendingInterrupt,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://127.0.0.1:8000";

const TYPEWRITER_MS_PER_CHAR = 12;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type Status = "idle" | "thinking" | "limited" | "error";

export function useChatSession(user: ChatUser) {
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
            content: "The message limit for this conversation has been reached. To continue, start a new conversation.",
            createdAt: Date.now(),
          });
          return;
        }

        if (!res.ok) {
          throw new Error(`Server error (${res.status})`);
        }

        const data: ChatApiResponse = await res.json();
        handleApiResponse(data);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setErrorText(err instanceof Error ? err.message : "Could not connect to the server.");
      }
    },
    [appendMessage, handleApiResponse, user]
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

  const resetConversation = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/chat/reset?thread_id=${user.id}`, { method: "POST" });
    } catch {
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