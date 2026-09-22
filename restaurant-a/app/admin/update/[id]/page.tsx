'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Meal } from '@/app/menu/entities/Dish';

export default function AdminUpdateByIdPage() {
  const params = useParams();
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [form, setForm] = useState<Partial<Meal>>({});

  useEffect(() => {
    const load = async () => {
      const id = Number(params?.id);
      if (!id || Number.isNaN(id)) {
        router.replace('/admin');
        return;
      }
      // fetch the meal by id
      const res = await fetch(`/api/meals/${id}`);
      if (!res.ok) {
        router.replace('/admin');
        return;
      }
      const data: Meal = await res.json();
      setMeal(data);
      setForm(data);
    };
    load();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meal) return;
    const id = meal.id;

    // API for updating by id is at /api/meals/[id] with PUT JSON body
    const res = await fetch(`/api/meals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        image: form.image,
        summary: form.summary,
        instructions: form.instructions,
        creator: form.creator,
        creator_email: form.creator_email,
        price: form.price,
        category: form.category,
      })
    });

    if (res.ok) {
      router.replace('/admin');
    }
  };

  if (!meal) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Update Meal</h1>
      <form className="space-y-2" onSubmit={handleSubmit}>
        <input
          className="border p-2 w-full"
          placeholder="Title"
          value={form.title || ''}
          onChange={e => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="border p-2 w-full"
          placeholder="Image URL"
          value={form.image || ''}
          onChange={e => setForm({ ...form, image: e.target.value })}
        />
       <input
  className="border p-2 w-full"
  placeholder="Price"
  type="number"
  step="0.01"
  value={form.price?.toString() ?? ''}   // همیشه مقدار معتبر
  onChange={e => {
    const val = e.target.value;
    setForm({
      ...form,
      price: val === '' ? undefined : parseFloat(val),  // اگر خالی بود NaN نذار
    });
  }}
  required
/>

        <input
          className="border p-2 w-full"
          placeholder="Category"
          value={form.category || ''}
          onChange={e => setForm({ ...form, category: e.target.value })}
        />
        <textarea
          className="border p-2 w-full"
          placeholder="Summary"
          value={form.summary || ''}
          onChange={e => setForm({ ...form, summary: e.target.value })}
        />
        <textarea
          className="border p-2 w-full"
          placeholder="Instructions"
          value={form.instructions || ''}
          onChange={e => setForm({ ...form, instructions: e.target.value })}
        />
        <input
          className="border p-2 w-full"
          placeholder="Creator"
          value={form.creator || ''}
          onChange={e => setForm({ ...form, creator: e.target.value })}
        />
        <input
          className="border p-2 w-full"
          placeholder="Creator Email"
          value={form.creator_email || ''}
          onChange={e => setForm({ ...form, creator_email: e.target.value })}
        />
        <button className="bg-blue-500 text-white p-2 rounded" type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
}


