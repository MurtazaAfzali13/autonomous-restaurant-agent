// فایل: lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// برای بک‌اند و عملیات‌های ادمین حتما از SERVICE_ROLE_KEY استفاده می‌کنیم تا محدودیت‌های امنیتی (RLS) را دور بزنیم
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ متغیرهای محیطی Supabase به درستی تنظیم نشده‌اند.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);