// app/api/chat-token/route.ts
// بعد از لاگین NextAuth، یک JWT ده‌دقیقه‌ای برای FastAPI صادر می‌کند.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { SignJWT } from "jose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const TOKEN_TTL_SECONDS = 600;

function getSecret() {
  const secret = process.env.BACKEND_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BACKEND_JWT_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string | number; email?: string | null; name?: string | null; role?: string }
    | undefined;

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // id باید همان users.id عددی دیتابیس باشد (همان که در carts/reservations استفاده می‌شود)
  const id = Number(user.id);
  if (!Number.isInteger(id) || id <= 0) {
    console.error("chat-token: session.user.id is missing or not numeric. Check NextAuth callbacks.");
    return NextResponse.json({ error: "session_missing_user_id" }, { status: 500 });
  }

  const token = await new SignJWT({
    email: user.email ?? "",
    name: user.name ?? user.email ?? `user-${id}`,
    role: user.role ?? "user",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(id))
    .setIssuer(process.env.JWT_ISSUER ?? "restaurant-web")
    .setAudience(process.env.JWT_AUDIENCE ?? "restaurant-ai-backend")
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecret());

  return NextResponse.json(
    { token, expiresIn: TOKEN_TTL_SECONDS },
    { headers: { "Cache-Control": "no-store" } }
  );
}
