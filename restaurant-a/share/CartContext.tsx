'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
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

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
}>({
  state: { items: [], orders: { todaysOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 } },
  dispatch: () => null,
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
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((item) => item.slug !== action.payload) };
    case "INCREASE_ITEM":
      return {
        ...state,
        items: state.items.map(item =>
          item.slug === action.payload
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    orders: { todaysOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 },
  });

  useEffect(() => {
    const savedItems = loadFromStorage<CartItem[]>(CART_STORAGE_KEY, []);
    if (savedItems.length > 0) {
      dispatch({ type: "LOAD_CART", payload: savedItems });
    }

    const savedOrders = loadFromStorage<OrderStats>(ORDER_STORAGE_KEY, {
      todaysOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
    });
    dispatch({ type: "LOAD_ORDERS", payload: savedOrders });

    const today = new Date().toISOString().slice(0, 10);
    const lastSavedDate = localStorage.getItem(ORDER_DATE_KEY);
    if (lastSavedDate !== today) {
      localStorage.removeItem(ORDER_STORAGE_KEY);
      localStorage.setItem(ORDER_DATE_KEY, today);
      dispatch({
        type: "LOAD_ORDERS",
        payload: { todaysOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 },
      });
    }
  }, []);

  useEffect(() => {
    saveToStorage(CART_STORAGE_KEY, state.items);
    saveToStorage(ORDER_STORAGE_KEY, state.orders);
  }, [state.items, state.orders]);

  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
