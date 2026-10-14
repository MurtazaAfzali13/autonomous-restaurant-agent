// lib/backend-client.ts  (فقط در کامپوننت‌های 'use client' استفاده شود)
const BACKEND_URL = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://127.0.0.1:8000";

let cached: { token: string; expiresAt: number } | null = null;

/** قبل از signOut() صدا بزنید تا توکن کاربر قبلی برای کاربر بعدی استفاده نشود. */
export function resetBackendToken() {
  cached = null;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cached && cached.expiresAt - Date.now() > 30_000) {
    return cached.token;
  }
  const res = await fetch("/api/chat-token", { cache: "no-store" });
  if (!res.ok) {
    cached = null;
    throw new Error(res.status === 401 ? "NOT_LOGGED_IN" : "TOKEN_ERROR");
  }
  const { token, expiresIn } = await res.json();
  cached = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = async (token: string) =>
    fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });

  let res = await doFetch(await getToken());
  if (res.status === 401) {
    // احتمالاً منقضی شده؛ یک بار با توکن تازه تلاش کن
    res = await doFetch(await getToken(true));
  }
  return res;
}

export type ChatReply =
  | { type: "message"; content: string; remaining: number | null }
  | { type: "interrupt"; data: any; remaining?: number | null };

export class DailyLimitError extends Error {}

// detail در FastAPI گاهی رشته است و در خطای 422 آرایه‌ای از آبجکت‌ها؛ هر دو را به متن خوانا تبدیل می‌کنیم.
async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => `${(d.loc ?? []).join(".")}: ${d.msg ?? "invalid"}`)
      .join("; ");
  }
  return `Server error (${res.status})`;
}

export async function sendChat(message: string, resume = false): Promise<ChatReply> {
  // عمداً user_id / name / email نمی‌فرستیم؛ هویت از توکن است.
  const res = await backendFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ message, resume }),
  });
  if (res.status === 429) throw new DailyLimitError((await res.json()).detail);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
