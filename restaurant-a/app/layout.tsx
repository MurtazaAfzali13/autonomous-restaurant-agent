import ClientRootLayout from "@/components/ClientRootLayout";
import Notifications from "@/components/Notification";
import ChatWidget from "@/components/chat-widget/ChatWidget";
import "./globals.css";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const session = await getServerSession(authOptions);

  let chatUser = undefined;
  if (session?.user) {
    chatUser = {
     id: Number(session.user.id), 
      name: session.user.name || session.user.firstname || "کاربر",
      email: session.user.email || "",
    };
  }

  return (
    <ClientRootLayout>
      {children}
      <Notifications />
      
      {session?.user && chatUser && (
        <ChatWidget user={chatUser} />
      )}
    </ClientRootLayout>
  );
}