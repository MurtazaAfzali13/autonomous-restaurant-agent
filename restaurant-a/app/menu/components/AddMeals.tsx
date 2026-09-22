"use server"
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // ✅ درست شد

export async function addMeal(prevState:string,formData: FormData) {
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const summary = formData.get("summary") as string;
  const instructions = formData.get("instructions") as string;
  const creator = formData.get("creator") as string;
  const creator_email = formData.get("creator_email") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string;

  const image = formData.get("image") as File | null;

  if (!title || !slug || !summary || !instructions || !creator || !creator_email || isNaN(price)) {
    throw new Error("All fields are required");
  }

  // پوشه تصاویر
  const imagesDir = path.join(process.cwd(), "public", "images", "meals");
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  let imagePath = "/images/meals/default.jpg";
  if (image && image.size > 0) {
    const buffer = Buffer.from(await image.arrayBuffer());
    const fileName = `${slug}-${Date.now()}.jpg`;
    const filePath = path.join(imagesDir, fileName);
    fs.writeFileSync(filePath, buffer);
    imagePath = `/images/meals/${fileName}`;
  }

  // دیتابیس
  const dbPath = path.join(process.cwd(), "meals.db");
  const db = new Database(dbPath);
  db.prepare(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      summary TEXT NOT NULL,
      instructions TEXT NOT NULL,
      creator TEXT NOT NULL,
      creator_email TEXT NOT NULL,
      price REAL NOT NULL
    )
  `).run();

db.prepare(`
  INSERT INTO meals (slug, title, image, summary, instructions, creator, creator_email, price, category)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(slug, title, imagePath, summary, instructions, creator, creator_email, price, category);


  db.close();

  // بعد از اضافه کردن غذا → refresh مسیر منو
  revalidatePath("/menu");

  // redirect به منو
  redirect("/menu");
}
