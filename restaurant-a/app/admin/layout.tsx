// app/admin/layout.tsx
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  if ((session.user as any).role !== "admin") {
    redirect("/403");
  }

  return <>{children}</>;
}
