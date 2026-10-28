import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// users.id (int8) — همان user_id که چت‌بات و جدول carts استفاده می‌کنند
export async function getUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;

  const direct = Number(u?.id);
  if (Number.isInteger(direct) && direct > 0) return direct;

  // اگر id در session نبود، با ایمیل از جدول users پیدا می‌کنیم
  if (!u?.email) return null;
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", u.email)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getActiveCartId(userId: number, create = false): Promise<number | null> {
  const { data } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("id")
    .limit(1);
  if (data?.length) return data[0].id as number;
  if (!create) return null;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId, status: "active" })
    .select("id")
    .single();
  if (error) throw error;
  return created.id as number;
}