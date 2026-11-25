// app/dashboard/meals/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ChefHat, Loader2, Pencil, Search, Trash2, X } from 'lucide-react';
import { COLORS, GlassCard, money } from '../components/ui';

interface AdminMeal {
  id: number;
  slug: string;
  title: string;
  image: string;
  summary: string;
  instructions: string;
  creator: string;
  creator_email: string;
  price: number;
  category: string | null;
  times_ordered: number;
}

const INPUT =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-400/60 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]';

/* ------------------------------------------------------------------ */
/* Modal shell                                                        */
/* ------------------------------------------------------------------ */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-[0_30px_90px_-20px_rgba(16,185,129,0.35)]">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-slate-400">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Edit modal                                                         */
/* ------------------------------------------------------------------ */
function EditModal({
  meal,
  categories,
  onClose,
  onSaved,
}: {
  meal: AdminMeal;
  categories: string[];
  onClose: () => void;
  onSaved: (m: AdminMeal) => void;
}) {
  const [form, setForm] = useState({
    title: meal.title,
    price: String(meal.price),
    category: meal.category ?? 'Other',
    image: meal.image,
    summary: meal.summary,
    instructions: meal.instructions,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgOk, setImgOk] = useState(true);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setError('');
    if (!form.title.trim()) return setError('Title is required.');
    if (!(Number(form.price) > 0)) return setError('Price must be greater than 0.');
    if (!form.image.trim()) return setError('Image URL is required.');
    if (!form.summary.trim()) return setError('Summary is required.');
    if (!form.instructions.trim()) return setError('Instructions are required.');

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/meals/${meal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save changes.');
      onSaved({ ...data.meal, times_ordered: meal.times_ordered });
    } catch (e: any) {
      setError(e.message || 'Failed to save changes.');
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit “${meal.title}”`} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        {/* image preview */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            {imgOk && form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt={form.title}
                className="h-full w-full object-cover"
                onError={() => setImgOk(false)}
                onLoad={() => setImgOk(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-[11px] text-slate-600">
                No preview
              </div>
            )}
          </div>
          <p className="mt-2 truncate text-[10px] text-slate-600">slug: {meal.slug}</p>
        </div>

        {/* fields */}
        <div className="space-y-3">
          <Field label="Title">
            <input className={INPUT} value={form.title} onChange={set('title')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price ($)">
              <input className={INPUT} type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
            </Field>
            <Field label="Category">
              <input className={INPUT} list="meal-categories" value={form.category} onChange={set('category')} />
              <datalist id="meal-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="Image URL">
            <input
              className={INPUT}
              value={form.image}
              onChange={(e) => {
                setImgOk(true);
                set('image')(e);
              }}
            />
          </Field>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <Field label="Summary">
          <textarea className={`${INPUT} min-h-[64px] resize-y`} value={form.summary} onChange={set('summary')} />
        </Field>
        <Field label="Instructions">
          <textarea className={`${INPUT} min-h-[110px] resize-y`} value={form.instructions} onChange={set('instructions')} />
        </Field>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={saving}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_0_24px_-6px_#10b981] transition hover:brightness-110 disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Delete modal                                                       */
/* ------------------------------------------------------------------ */
function DeleteModal({
  meal,
  onClose,
  onDeleted,
}: {
  meal: AdminMeal;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const blocked = meal.times_ordered > 0;

  const remove = async () => {
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/meals/${meal.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete the dish.');
      onDeleted(meal.id);
    } catch (e: any) {
      setError(e.message || 'Failed to delete the dish.');
      setDeleting(false);
    }
  };

  return (
    <Modal title="Delete dish" onClose={onClose}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300 shadow-[0_0_20px_-4px_#fb7185]">
          <Trash2 size={18} />
        </span>
        <div className="text-sm text-slate-300">
          <p>
            Delete <span className="font-bold text-white">{meal.title}</span> ({money(meal.price)})?
          </p>
          {blocked ? (
            <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              This dish appears in {meal.times_ordered} order item(s), so it can&apos;t be deleted without breaking order
              history. You can edit it instead.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              This also removes it from customers&apos; carts and deletes its ratings. This can&apos;t be undone.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={deleting}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={remove}
          disabled={deleting || blocked}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_24px_-6px_#fb7185] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting && <Loader2 size={14} className="animate-spin" />}
          Delete dish
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function ManageMealsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [meals, setMeals] = useState<AdminMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [editing, setEditing] = useState<AdminMeal | null>(null);
  const [deleting, setDeleting] = useState<AdminMeal | null>(null);
  const [toast, setToast] = useState('');

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/meals');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load dishes.');
      setMeals(data.meals || []);
    } catch (e: any) {
      setLoadError(e.message || 'Failed to load dishes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/403');
      return;
    }
    load();
  }, [session, status, router, load]);

  const categories = useMemo(
    () => Array.from(new Set(meals.map((m) => m.category || 'Other'))).sort(),
    [meals]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meals.filter((m) => {
      const matchCat = category === 'All' || (m.category || 'Other') === category;
      const matchQuery = !q || m.title.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [meals, query, category]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-slate-300">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-400" />
        <p className="text-sm tracking-widest text-emerald-400">Loading dishes...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[320px] w-[320px] rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="absolute right-0 top-40 h-[300px] w-[300px] rounded-full bg-violet-600/15 blur-[110px]" />
      </div>

      <div className="relative z-10">
        <header className="mb-4">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Menu management
          </div>
          <h1 className="bg-gradient-to-r from-white via-emerald-100 to-sky-300 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
            Manage Meals
          </h1>
          <p className="mt-1 text-sm text-slate-400">Edit prices, photos and descriptions, or remove dishes from the menu.</p>
        </header>

        <GlassCard
          title="All dishes"
          subtitle={`${filtered.length} of ${meals.length} shown`}
          icon={ChefHat}
          accent={COLORS.emerald}
          right={
            <div className="relative w-44 sm:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes..."
                className={`${INPUT} !py-1.5 pl-8`}
              />
            </div>
          }
        >
          {/* category filter */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {['All', ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                  category === c
                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_16px_-4px_#10b981]'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loadError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-rose-300">{loadError}</p>
              <button
                onClick={load}
                className="rounded-xl border border-white/10 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No dishes match your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Dish</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Price</th>
                    <th className="px-3 py-2 font-semibold">Orders</th>
                    <th className="px-3 py-2 font-semibold">Creator</th>
                    <th className="py-2 pl-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.03]">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.image}
                            alt={m.title}
                            className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                            onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{m.title}</p>
                            <p className="truncate text-[11px] text-slate-500">{m.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
                          {m.category || 'Other'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-emerald-300">{money(m.price)}</td>
                      <td className="px-3 py-2 text-slate-300">{m.times_ordered}</td>
                      <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-400">{m.creator}</td>
                      <td className="py-2 pl-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditing(m)}
                            className="flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleting(m)}
                            className="flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {editing && (
        <EditModal
          meal={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setMeals((list) => list.map((m) => (m.id === updated.id ? updated : m)));
            setEditing(null);
            notify(`“${updated.title}” was updated.`);
          }}
        />
      )}

      {deleting && (
        <DeleteModal
          meal={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(id) => {
            setMeals((list) => list.filter((m) => m.id !== id));
            notify(`“${deleting.title}” was deleted.`);
            setDeleting(null);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-emerald-400/30 bg-slate-950/95 px-4 py-2.5 text-sm text-emerald-200 shadow-[0_0_30px_-6px_#10b981] backdrop-blur-xl">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
