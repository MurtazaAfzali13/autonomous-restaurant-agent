import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { Meal } from "../entities/Dish";

// مسیر دیتابیس از root پروژه
const dbDir = path.join(process.cwd(), "data/lib");
const dbPath = path.join(dbDir, "meals.db");

// ایجاد پوشه در صورت نبودن
fs.mkdirSync(dbDir, { recursive: true });

// باز کردن دیتابیس (اگر فایل موجود نبود، ساخته می‌شود)
const db = new Database(dbPath);

// ایجاد جدول meals در صورت نبودن
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

// Repository
export const dishRepository = {
  async getAll(): Promise<Meal[]> {
    const stmt = db.prepare("SELECT * FROM meals");
    const meals = stmt.all() as Meal[]; // Type assertion
    return meals;
  },

  async getBySlug(slug: string): Promise<Meal> {
    const stmt = db.prepare("SELECT * FROM meals WHERE slug = ?");
    const meal = stmt.get(slug) as Meal | undefined; // Type assertion
    if (!meal) throw new Error("Meal not found");
    return meal;
  }
};