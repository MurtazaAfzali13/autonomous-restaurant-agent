"use client";

import { useState } from "react";
import { ChatLauncher } from "./ChatLauncher";
import { ChatModal } from "./ChatModal";
import { useChatSession } from "./useChatSession";
import type { ChatUser } from "./types";

interface ChatWidgetProps {
  /**
   * کاربر فعلی. اگر پاس داده نشود، از یک کاربر مهمان (guest) استفاده می‌شود —
   * برای رستوران واقعی پیشنهاد می‌شود این را از session/auth واقعی پروژه پر کنید.
   */
  user?: ChatUser;
}

const GUEST_USER: ChatUser = {
  id: 0,
  name: "مهمان",
  email: "guest@example.com",
};

export default function ChatWidget({ user = GUEST_USER }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const session = useChatSession(user);

  return (
    <>
      {!open && <ChatLauncher onClick={() => setOpen(true)} />}
      <ChatModal open={open} onClose={() => setOpen(false)} session={session} />
    </>
  );
}
