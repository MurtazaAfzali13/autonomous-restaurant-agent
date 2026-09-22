import db from "@/lib/db";

type ClientCallback = (msg: string) => void;
const clients: { email: string, callback: ClientCallback }[] = [];

// ثبت کلاینت‌ها
export function registerClient(email: string, callback: ClientCallback) {
  clients.push({ email, callback });
}

// حذف کلاینت
export function unregisterClient(email: string) {
  const index = clients.findIndex(c => c.email === email);
  if (index !== -1) clients.splice(index, 1);
}

// ارسال پیام به کاربران سبد
export function notifyUsersInCart(message: string) {
  // دریافت ایمیل‌های کاربران که در سبد هستند
  const rows = db.prepare("SELECT DISTINCT customer_email FROM orders WHERE total_price > 0").all();
  const emailsInCart = rows.map((r: any) => r.customer_email);

  // ارسال پیام فقط به کلاینت‌های متصل با ایمیل موجود در سبد
  clients.forEach(c => {
    if (emailsInCart.includes(c.email)) {
      c.callback(message);
    }
  });
}
