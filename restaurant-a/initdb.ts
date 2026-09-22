// scripts/init-db.ts
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { dummyMeals } from "./data/dummy-data.js";

/* =======================================================
   🍔 ایجاد اتصال به دیتابیس
======================================================= */
const db = new Database("meals.db");


/* =======================================================
   🧾 ساخت جداول دیتابیس
======================================================= */
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
    price REAL NOT NULL,
    category TEXT DEFAULT 'Other'
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    total_price REAL NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    meal_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstname TEXT,
    lastname TEXT,
    role TEXT DEFAULT 'customer',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    meal_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    UNIQUE(user_id, meal_id)
  )
`).run();

/* =======================================================
   ⚙️ مقداردهی اولیه داده‌ها
======================================================= */
async function initializeDatabase() {
  try {
    // 🥗 افزودن داده‌های اولیه
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO meals (
        slug, title, image, summary, instructions, creator, creator_email, price, category
      ) VALUES (
        @slug, @title, @image, @summary, @instructions, @creator, @creator_email, @price, @category
      )
    `);

    for (const meal of dummyMeals) {
      stmt.run(meal);
    }

    console.log("✅ Dummy data inserted successfully!");

    // 👤 افزودن ادمین پیش‌فرض
    const adminEmail = "murtaza@gmail.com";
    const adminPassword = "murtaza123";
    const adminFirstName = "Murtaza";
    const adminLastName = "Admin";

    const existingAdmin = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(adminEmail);

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      db.prepare(`
        INSERT INTO users (email, password, firstname, lastname, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(adminEmail, hashedPassword, adminFirstName, adminLastName, "admin");

      console.log("✅ Default admin created:");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log("⚙️ Admin already exists, skipping...");
    }
  } catch (err) {
    console.error("❌ Error initializing database:", err);
  } finally {
    db.close();
    console.log("🚀 Database initialization complete.");
  }
}

/* =======================================================
   ▶️ اجرای تابع اصلی
======================================================= */
initializeDatabase();
