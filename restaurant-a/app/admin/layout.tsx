import { ReactNode } from "react";
import { getToken } from "next-auth/jwt";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ساخت یک شی شبیه NextRequest
  const req = {
    headers,
    cookies,
  } as unknown as NextRequest; // cast برای رفع خطای تایپ

  const token = await getToken({
    secret: process.env.NEXTAUTH_SECRET,
    req,
  });

  if (!token) {
    redirect("/auth");
  }

  if (token.role !== "admin") {
    redirect("/403");
  }

  return <>{children}</>;
}
