import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase"; // مسیر فایل کمکی سوپابیس خود را بدهید

export async function POST(req: Request) {
  try {
    const { email, password, firstname, lastname, role } = await req.json();

    // اعتبارسنجی ساده
    if (!email || !email.includes("@") || !password || password.length < 7) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 422 });
    }

    // چک کاربر موجود در سوپابیس
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking user:", checkError);
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    // ثبت کاربر در سوپابیس
    const { error: insertError } = await supabase
      .from("users")
      .insert([
        {
          email,
          password: hashedPassword,
          firstname: firstname || null,
          lastname: lastname || null,
          role: role || "customer"
        }
      ]);

    if (insertError) {
      console.error("❌ Error inserting user:", insertError);
      return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User created successfully" }, { status: 201 });
  } catch (err) {
    console.error("❌ Registration error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}