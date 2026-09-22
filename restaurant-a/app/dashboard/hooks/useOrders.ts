'use client';

import { useState, useEffect } from "react";

export type OrderItem = {
  id: number;
  order_id: number;
  title: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: number;
  customer_name: string;
  customer_email?: string;
  total_price: number;
  created_at: string;
  items: OrderItem[];
};

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrderItem = async (orderId: number, itemId: number) => {
    try {
      const res = await fetch(`/api/admin/order-items/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        // به‌روزرسانی آرایه محلی
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? { ...order, items: order.items.filter(item => item.id !== itemId) }
              : order
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, fetchOrders, deleteOrderItem };
}


