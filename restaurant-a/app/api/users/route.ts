import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

// اتصال به دیتابیس با کلید ادمین (Service Role Key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 🔒 بررسی دسترسی ادمین (برای امنیت اطلاعات کاربران)
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 📥 دریافت لیست کاربران از Supabase
    // نکته امنیتی: فیلد password را عمداً در select ننوشتیم تا به کلاینت ارسال نشود!
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, firstname, lastname, role, created_at") 
      .order("created_at", { ascending: false }); // کاربران جدیدتر اول لیست باشند

    if (error) {
      console.error("❌ Supabase Error fetching users:", error);
      throw error;
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    console.error("❌ Error fetching users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users", details: err.message },
      { status: 500 }
    );
  }
}