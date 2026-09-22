'use client';

import { useCart, CartItem } from "@/share/CartContext";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

function ShimmerButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group relative overflow-hidden flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-500 active:scale-[0.98] ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export default function CartPage() {
  const { state, dispatch } = useCart();
  const dishes: CartItem[] = state.items;
  const { data: session } = useSession();
  const [showConfirm, setShowConfirm] = useState(false);

  const totalPrice = dishes.reduce((sum, dish) => sum + dish.price * dish.quantity, 0);
  const itemCount = dishes.reduce((sum, d) => sum + d.quantity, 0);

  const handleRemoveItem = (slug: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: slug });
  };

  const handleCheckout = async () => {
    if (dishes.length === 0) return;
    if (!session?.user?.email) {
      alert("You must login to place an order!");
      return;
    }

    try {
      const customerEmail = session.user.email;
      const first = session.user.firstname || "";
      const last = session.user.lastname || "";
      const customerName = `${first} ${last}`.trim() || "Customer";

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          items: dishes.map((d) => ({
            id: d.id,
            quantity: d.quantity,
            price: d.price,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        dispatch({ type: "CLEAR_CART" });
        setShowConfirm(false);
        window.location.href = `/order/success?orderId=${data.orderId}`;
      } else {
        alert("Could not place your order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };

  return (
    <section className="min-h-screen bg-[#0a0f1a] selection:bg-emerald-500/30 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Your Selection
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Shopping Cart
          </h1>
        </div>

        {dishes.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <ul className="lg:col-span-2 space-y-4">
              {dishes.map((dish, index) => (
                <li
                  key={`${dish.slug}-${index}`}
                  className="group bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-5 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] transition-all duration-500"
                >
                  <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-700/80 shadow-lg">
                    <img
                      src={dish.image}
                      alt={dish.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-lg font-bold text-white truncate">{dish.title}</h3>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{dish.summary}</p>

                    <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => dish.slug && dispatch({ type: "DECREASE_ITEM", payload: dish.slug })}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-emerald-400">{dish.quantity}</span>
                        <button
                          type="button"
                          onClick={() => dish.slug && dispatch({ type: "INCREASE_ITEM", payload: dish.slug })}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-lg font-bold text-emerald-400">
                        ${(dish.price * dish.quantity).toFixed(2)}
                      </p>

                      <button
                        type="button"
                        onClick={() => dish.slug && handleRemoveItem(dish.slug)}
                        className="inline-flex items-center gap-1.5 text-sm text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-400/50 px-3 py-1.5 rounded-full transition-all duration-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                <div className="space-y-3 text-sm border-b border-slate-800 pb-5 mb-5">
                  <div className="flex justify-between text-slate-400">
                    <span>Items</span>
                    <span className="text-slate-200 font-semibold">{itemCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-slate-200 font-semibold">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-8">
                  <span className="text-lg font-semibold text-slate-300">Total</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <ShimmerButton onClick={() => setShowConfirm(true)} className="w-full py-4 text-lg">
                  Proceed to Checkout
                </ShimmerButton>
                <Link
                  href="/menu"
                  className="mt-4 block text-center text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Continue browsing menu
                </Link>
              </div>
            </aside>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 text-center hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] transition-all duration-500">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 animate-pulse">
              <ShoppingBag className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-slate-400 mb-8">Add something delicious from our premium menu.</p>
            <Link href="/menu">
              <ShimmerButton className="px-8 py-3.5">Return to Menu</ShimmerButton>
            </Link>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
          <div
            className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.15)]"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Confirm Order</h3>
            <p className="text-slate-400 mb-8">Place this order for ${totalPrice.toFixed(2)}?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <ShimmerButton onClick={handleCheckout} className="flex-1 py-3">
                Yes, Confirm
              </ShimmerButton>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
