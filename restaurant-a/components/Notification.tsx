// components/Notification.tsx
'use client';

import { useSession } from "next-auth/react";

export default function Notifications() {
  const { data: session } = useSession();
  const email = session?.user?.email || "";

  // منطق مربوط به notifications
  return (
    <div>
      {/* محتوای notifications شما */}
    </div>
  );
}