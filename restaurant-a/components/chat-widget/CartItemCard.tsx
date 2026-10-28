"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { resolveMealImage } from "@/lib/meal-image";
import type { CartItemAddedCard } from "./types";

export function CartItemCard({ card }: { card: CartItemAddedCard }) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const src = resolveMealImage(card.image);
  const showImage = !!src && !broken;

  const unit = Number(card.price);
  const total = unit * card.quantity_added;
  const extraInCart = card.quantity_in_cart > card.quantity_added;

  // اگر عکس از کش مرورگر قبل از اتصال onLoad آماده بود، skeleton برای همیشه نماند
  useEffect(() => {
    setLoaded(false);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-md shadow-orange-900/10">
      {/* عکس: کل عرض کارت؛ نسبت ثابت تا هنگام لود شدن صفحه نپرد */}
      <div
        className={`relative w-full overflow-hidden bg-orange-100 ${
          showImage ? "aspect-[16/10]" : "aspect-[16/6]"
        } ${showImage && !loaded ? "animate-pulse" : ""}`}
      >
        {showImage ? (
          // <img> ساده: برای آدرس‌های خارجی نیازی به remotePatterns در next.config نیست
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={src!}
            alt={card.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-orange-400" />
          </div>
        )}

        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 shadow-sm backdrop-blur">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Added to cart
        </span>
      </div>

      {/* مشخصات زیر عکس */}
      <div className="flex items-end justify-between gap-3 px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-stone-900">{card.title}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            {card.quantity_added} × ${unit}
            {extraInCart && <span className="text-stone-400"> · {card.quantity_in_cart} in cart</span>}
          </p>
        </div>
        <p className="shrink-0 text-lg font-bold leading-none text-orange-600">${total}</p>
      </div>
    </div>
  );
}
