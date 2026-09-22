// app/api/notifications/stream/route.ts
import { NextResponse } from "next/server";

type Client = {
  email: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const clients: Client[] = [];

export function notifyUsersInCart(message: string, emailsInCart: string[]) {
  const encoder = new TextEncoder();
  clients.forEach(c => {
    if (emailsInCart.includes(c.email)) {
      c.controller.enqueue(encoder.encode(`data: ${message}\n\n`));
    }
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // ثبت کلاینت
      clients.push({ email, controller });

      // ارسال ping هر 15 ثانیه
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`data: \n\n`));
      }, 15000);

      // وقتی client disconnect شد
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        const index = clients.findIndex(c => c.controller === controller);
        if (index !== -1) clients.splice(index, 1);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
