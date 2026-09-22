"use client";

import { useState } from "react";
import SubmitButton from "./SubmitButton";
import FormError from "./FormError";
import ImagePicker from "./ImagePicker";

export default function MealForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget; // ✅ فرم رو ذخیره می‌کنیم
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add meal.");
        return;
      }

      // ✅ پاک‌سازی فرم بعد از پاسخ موفق
      form.reset();

      // ✅ هدایت به صفحه‌ی /menu
      window.location.href = "/menu";

    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-gray-800 p-6 rounded-2xl shadow-lg max-w-lg mx-auto"
    >
      <h2 className="text-2xl font-semibold text-center mb-2">🍽️ Add a New Meal</h2>

      <input name="title" placeholder="Title" className="input border rounded-lg p-2" required />
      <input name="slug" placeholder="Slug (unique name, e.g. juicy-burger)" className="input border rounded-lg p-2" required />
      <textarea name="summary" placeholder="Short summary..." className="input border rounded-lg p-2" required />
      <textarea name="instructions" placeholder="Cooking instructions..." className="input border rounded-lg p-2 h-32" required />
      <input name="creator" placeholder="Creator Name" className="input border rounded-lg p-2" required />
      <input name="creator_email" type="email" placeholder="Creator Email" className="input border rounded-lg p-2" required />
      <input name="price" type="number" step="0.01" placeholder="Price ($)" className="input border rounded-lg p-2" required />

      {/* ✅ دسته‌بندی */}
      <select name="category" className="input border rounded-lg p-2" required>
        <option value="">Select Category</option>
        <option value="Burger">🍔 Burger</option>
        <option value="Smoothie">🍹 Smoothie</option>
        <option value="Pizza">🍕 Pizza</option>
        <option value="Healthy">🥗 Healthy</option>
        <option value="Special">🍛 Special</option>
        <option value="Dessert">🍰 Dessert</option>
        <option value="Drink">🥤 Drink</option>
        <option value="Traditional">🍢 Traditional</option>
      </select>

      <ImagePicker name="image" />
      <SubmitButton />
      <FormError error={error || ""} />
    </form>
  );
}
