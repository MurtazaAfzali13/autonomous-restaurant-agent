'use client';

import React, {
  createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useRef,
} from "react";
import { useSession } from "next-auth/react";
import { Meal } from "@/app/menu/entities/Dish";

export interface OrderStats {
  todaysOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export interface CartItem extends Meal {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  orders: OrderStats;
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: Meal }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "INCREASE_ITEM"; payload: string }
  | { type: "DECREASE_ITEM"; payload: string }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "CLEAR_CART" }
  | { type: "UPDATE_ORDERS"; payload: Partial<OrderStats> }
  | { type: "LOAD_ORDERS"; payload: OrderStats };

const CART_STORAGE_KEY = "restaurant-cart";
const ORDER_STORAGE_KEY = "restaurant-orders";
const ORDER_DATE_KEY = "ordersDate";

const EMPTY_ORDERS: OrderStats = { todaysOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  refreshCart: () => Promise<void>;
}>({
  state: { items: [], orders: EMPTY_ORDERS },
  dispatch: () => null,
  refreshCart: async () => {},
});

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(item => item.slug === action.payload.slug);
      if (existing) {
        return {
          ...state,
          items: state.items.map(item =>
            item.slug === action.payload.slug
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((item) => item.slug !== action.payload) };
    case "INCREASE_ITEM":
      return {
        ...state,
        items: state.items.map(item =>
          item.slug === action.payload ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        ),
      };
    case "DECREASE_ITEM":
      return {
        ...state,
        items: state.items.map(item =>
          item.slug === action.payload
            ? { ...item, quantity: Math.max((item.quantity || 1) - 1, 1) }
            : item
        ),
      };
    case "LOAD_CART":
      return { ...state, items: action.payload };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "UPDATE_ORDERS":
      return { ...state, orders: { ...state.orders, ...action.payload } };
    case "LOAD_ORDERS":
      return { ...state, orders: action.payload };
    default:
      return state;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (err) {
    console.error("Failed to load from localStorage:", err);
    return defaultValue;
  }
};

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} failed (${res.status})`);
  return res;
}

const postDelta = (mealId: number | string, delta: number) =>
  api("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealId: Number(mealId), delta }),
  });

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useSession(); // SessionProvider باید بالاتر از CartProvider باشد
  const isAuthed = status === "authenticated";

  const [state, rawDispatch] = useReducer(cartReducer, { items: [], orders: EMPTY_ORDERS });

  const stateRef = useRef(state);
  stateRef.current = state;

  const pending = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const prevStatus = useRef(status);

  // ---- خواندن کارت از دیتابیس ----
  const refreshCart = useCallback(async () => {
    if (pending.current > 0) return; // تغییر در راه است؛ state را بازنویسی نکن
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const { items } = await res.json();
      if (pending.current > 0) return;
      rawDispatch({ type: "LOAD_CART", payload: items });
    } catch {}
  }, []);

  // ---- صف نوشتن در دیتابیس (ترتیب درخواست‌ها حفظ می‌شود) ----
  const enqueue = useCallback((job: () => Promise<unknown>) => {
    pending.current += 1;
    queue.current = queue.current
      .then(job)
      .catch((e) => console.error("Cart sync failed:", e))
      .finally(() => {
        pending.current -= 1;
        if (pending.current === 0) void refreshCart();
      });
  }, [refreshCart]);

  // ---- dispatch هوشمند: state را فوری عوض می‌کند، بعد با دیتابیس sync می‌کند ----
  const dispatch = useCallback((action: CartAction) => {
    if (isAuthed) {
      const items = stateRef.current.items;
      const findBySlug = (slug: string) => items.find(i => i.slug === slug);

      switch (action.type) {
        case "ADD_ITEM":
          enqueue(() => postDelta(action.payload.id as any, 1));
          break;
        case "INCREASE_ITEM": {
          const it = findBySlug(action.payload);
          if (it) enqueue(() => postDelta(it.id as any, 1));
          break;
        }
        case "DECREASE_ITEM": {
          const it = findBySlug(action.payload);
          if (it && (it.quantity || 1) > 1) enqueue(() => postDelta(it.id as any, -1));
          break;
        }
        case "REMOVE_ITEM": {
          const it = findBySlug(action.payload);
          if (it) enqueue(() => api(`/api/cart?mealId=${Number(it.id)}`, { method: "DELETE" }));
          break;
        }
        case "CLEAR_CART":
          enqueue(() => api("/api/cart", { method: "DELETE" }));
          break;
      }
    }
    rawDispatch(action);
  }, [isAuthed, enqueue]);

  // ---- آمارهای سفارش (مثل قبل، همچنان localStorage) ----
  useEffect(() => {
    const savedOrders = loadFromStorage<OrderStats>(ORDER_STORAGE_KEY, EMPTY_ORDERS);
    rawDispatch({ type: "LOAD_ORDERS", payload: savedOrders });

    const today = new Date().toISOString().slice(0, 10);
    const lastSavedDate = localStorage.getItem(ORDER_DATE_KEY);
    if (lastSavedDate !== today) {
      localStorage.removeItem(ORDER_STORAGE_KEY);
      localStorage.setItem(ORDER_DATE_KEY, today);
      rawDispatch({ type: "LOAD_ORDERS", payload: EMPTY_ORDERS });
    }
  }, []);

  // ---- تغییر وضعیت لاگین ----
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      (async () => {
        // کارت مهمان (اگر بود) یک‌بار به دیتابیس منتقل می‌شود
        const local = loadFromStorage<CartItem[]>(CART_STORAGE_KEY, []);
        if (local.length > 0) {
          try {
            for (const it of local) await postDelta(it.id as any, it.quantity || 1);
            localStorage.removeItem(CART_STORAGE_KEY);
          } catch (e) {
            console.error("Guest cart merge failed:", e);
          }
        }
        await refreshCart();
      })();
    } else if (prevStatus.current === "authenticated") {
      // لاگ‌اوت: کارت کاربر قبلی نباید در مرورگر بماند
      rawDispatch({ type: "CLEAR_CART" });
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      // مهمان: همان رفتار قبلی
      const savedItems = loadFromStorage<CartItem[]>(CART_STORAGE_KEY, []);
      if (savedItems.length > 0) rawDispatch({ type: "LOAD_CART", payload: savedItems });
    }
    prevStatus.current = status;
  }, [status, refreshCart]);

  // ---- ذخیره‌سازی ----
  useEffect(() => {
    saveToStorage(ORDER_STORAGE_KEY, state.orders);
  }, [state.orders]);

  useEffect(() => {
    // فقط برای مهمان؛ برای کاربر لاگین‌شده، دیتابیس منبع حقیقت است
    if (status === "unauthenticated") saveToStorage(CART_STORAGE_KEY, state.items);
  }, [state.items, status]);

  // ---- رفرش با رویداد چت و focus ----
  useEffect(() => {
    if (!isAuthed) return;
    const h = () => void refreshCart();
    window.addEventListener("cart:refresh", h);
    window.addEventListener("focus", h);
    return () => {
      window.removeEventListener("cart:refresh", h);
      window.removeEventListener("focus", h);
    };
  }, [isAuthed, refreshCart]);

  return (
    <CartContext.Provider value={{ state, dispatch, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);