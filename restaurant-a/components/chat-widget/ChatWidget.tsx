"use client";

import { useEffect, useState } from "react";
import { ChatLauncher } from "./ChatLauncher";
import { ChatModal } from "./ChatModal";
import { useChatSession } from "./useChatSession";
import type { ChatUser } from "./types";

interface ChatWidgetProps {
  /** @deprecated هویت از نشست NextAuth (توکن) می‌آید؛ این prop دیگر استفاده نمی‌شود. */
  user?: ChatUser;
}

export default function ChatWidget(_props: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const session = useChatSession();
  const { restore } = session;

  // گفتگوی قبلی (و تاییدیه‌ی در انتظار) فقط وقتی کاربر چت را باز می‌کند از سرور خوانده می‌شود
  useEffect(() => {
    if (open) void restore();
  }, [open, restore]);

  return (
    <>
      {!open && <ChatLauncher onClick={() => setOpen(true)} />}
      <ChatModal open={open} onClose={() => setOpen(false)} session={session} />
    </>
  );
}
