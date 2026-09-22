import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// نام تابع از middleware به proxy تغییر یافت
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl;

  // محافظت از مسیرهای /admin
  if (url.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    if (token?.role !== "admin") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};