import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js"; 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: meals, error } = await supabase
      .from("meals")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    return NextResponse.json(meals);
  } catch (err: any) {
    console.error("❌ Error fetching meals:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== "admin") return new Response("Forbidden", { status: 403 });

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const summary = formData.get("summary") as string;
    const instructions = formData.get("instructions") as string;
    const creator = formData.get("creator") as string;
    const creator_email = formData.get("creator_email") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = (formData.get("category") as string) || "Other";
    const image = formData.get("image") as File | null;

    if (!title || !slug || !summary || !instructions || !creator || !creator_email || isNaN(price)) {
      return NextResponse.json({ error: "تمام فیلدها الزامی هستند." }, { status: 400 });
    }

    const imagesDir = path.join(process.cwd(), "public", "images", "meals");
    await fs.mkdir(imagesDir, { recursive: true });

    let imagePath = "/images/meals/default.jpg";

    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const optimizedBuffer = await sharp(buffer)
        .resize(1024, 1024, { fit: "inside" })
        .jpeg({ quality: 85 })
        .toBuffer();

      const fileName = `${slug}-${Date.now()}.jpg`;
      const filePath = path.join(imagesDir, fileName);
      await fs.writeFile(filePath, optimizedBuffer);
      imagePath = `/images/meals/${fileName}`;
    }

    const { error: insertError } = await supabase
      .from("meals")
      .insert([
        {
          slug,
          title,
          image: imagePath,
          summary,
          instructions,
          creator,
          creator_email,
          price,
          category
        }
      ]);

    if (insertError) throw insertError;

    return NextResponse.json({ message: "✅ Meal added successfully!" });
  } catch (err: any) {
    console.error("❌ Insert error:", err);
    return NextResponse.json({ error: "Failed to add meal", details: err.message }, { status: 500 });
  }
}