from langchain_core.tools import tool
from app import db


@tool
def add_to_cart(user_id: int, meal_id: int, quantity: int = 1) -> str:
    """
    افزودن غذا به سبد خرید کاربر. مستقیماً در جدول cart_items ثبت می‌شود
    (نه در حافظه گراف)، تا فرانت از طریق Supabase Realtime همان لحظه آپدیت شود.
    """
    try:
        item = db.add_cart_item(user_id, meal_id, quantity)
        return f"{quantity} عدد به سبد اضافه شد (ردیف دیتابیس: {item['id']})."
    except ValueError:
        return "غذایی با این شناسه پیدا نشد."


@tool
def remove_from_cart(user_id: int, meal_id: int) -> str:
    """حذف یک قلم از سبد خرید کاربر."""
    db.remove_cart_item(user_id, meal_id)
    return "آیتم از سبد خرید حذف شد."


@tool
def view_cart(user_id: int) -> str:
    """نمایش دقیق سبد خرید فعلی کاربر — همیشه از دیتابیس خوانده می‌شود، هرگز حدس زده نمی‌شود."""
    items = db.get_cart_items(user_id)
    if not items:
        return "سبد خرید خالی است."
    total = sum(i["price"] * i["quantity"] for i in items)
    lines = [f"- {i['meals']['title']} × {i['quantity']} = ${i['price'] * i['quantity']}" for i in items]
    return "\n".join(lines) + f"\nجمع کل: ${total}"
