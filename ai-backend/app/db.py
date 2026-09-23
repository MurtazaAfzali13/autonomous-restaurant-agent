from datetime import date
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, MAX_MESSAGES_PER_DAY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ---------------------------------------------------------------------------
# Meals / Menu
# ---------------------------------------------------------------------------

def search_meals(category: str | None = None, search_term: str | None = None) -> list[dict]:
    query = supabase.table("meals").select("id, title, summary, price, category, image")
    if category:
        query = query.ilike("category", f"%{category}%")
    if search_term:
        query = query.ilike("title", f"%{search_term}%")
    return query.execute().data


def get_meal(meal_id: int) -> dict | None:
    res = supabase.table("meals").select("*").eq("id", meal_id).single().execute()
    return res.data


# ---------------------------------------------------------------------------
# Cart — همه‌ی عملیات سبد خرید از همین‌جا رد می‌شود، چه چت‌بات چه هر endpoint دیگر.
# این باعث می‌شود فرانت و چت‌بات هرگز از هم عقب نیفتند.
# ---------------------------------------------------------------------------

def get_or_create_active_cart(user_id: int) -> dict:
    res = supabase.table("carts").select("*").eq("user_id", user_id).eq("status", "active").execute()
    if res.data:
        return res.data[0]
    created = supabase.table("carts").insert({"user_id": user_id, "status": "active"}).execute()
    return created.data[0]


def get_cart_items(user_id: int) -> list[dict]:
    cart = get_or_create_active_cart(user_id)
    res = (
        supabase.table("cart_items")
        .select("id, meal_id, quantity, price, meals(title)")
        .eq("cart_id", cart["id"])
        .execute()
    )
    return res.data


def add_cart_item(user_id: int, meal_id: int, quantity: int = 1) -> dict:
    cart = get_or_create_active_cart(user_id)
    meal = get_meal(meal_id)
    if not meal:
        raise ValueError("meal_not_found")

    existing = (
        supabase.table("cart_items")
        .select("*")
        .eq("cart_id", cart["id"])
        .eq("meal_id", meal_id)
        .execute()
    )
    if existing.data:
        item = existing.data[0]
        updated = (
            supabase.table("cart_items")
            .update({"quantity": item["quantity"] + quantity})
            .eq("id", item["id"])
            .execute()
        )
        return updated.data[0]

    inserted = (
        supabase.table("cart_items")
        .insert({"cart_id": cart["id"], "meal_id": meal_id, "quantity": quantity, "price": meal["price"]})
        .execute()
    )
    return inserted.data[0]


def remove_cart_item(user_id: int, meal_id: int) -> None:
    cart = get_or_create_active_cart(user_id)
    supabase.table("cart_items").delete().eq("cart_id", cart["id"]).eq("meal_id", meal_id).execute()


def clear_cart(cart_id: int) -> None:
    supabase.table("cart_items").delete().eq("cart_id", cart_id).execute()


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

def create_order_from_cart(user_id: int, customer_name: str, customer_email: str) -> dict:
    cart = get_or_create_active_cart(user_id)
    items = get_cart_items(user_id)
    if not items:
        raise ValueError("empty_cart")

    total_price = sum(i["price"] * i["quantity"] for i in items)

    order = supabase.table("orders").insert({
        "customer_name": customer_name,
        "customer_email": customer_email,
        "total_price": total_price,
        "status": "pending",
    }).execute().data[0]

    order_items_payload = [
        {"order_id": order["id"], "meal_id": i["meal_id"], "quantity": i["quantity"], "price": i["price"]}
        for i in items
    ]
    supabase.table("order_items").insert(order_items_payload).execute()

    # سبد را خالی و کارت را checked_out می‌کنیم؛ همان لحظه فرانت (Realtime) خالی شدن سبد را می‌بیند
    clear_cart(cart["id"])
    supabase.table("carts").update({"status": "checked_out"}).eq("id", cart["id"]).execute()

    return order


def get_order(order_id: int) -> dict | None:
    res = supabase.table("orders").select("*").eq("id", order_id).single().execute()
    return res.data


def get_order_status(order_id: int) -> str | None:
    order = get_order(order_id)
    return order["status"] if order else None


def get_order_with_items(order_id: int) -> dict | None:
    order = get_order(order_id)
    if not order:
        return None
    items = (
        supabase.table("order_items")
        .select("id, meal_id, quantity, price, meals(title)")
        .eq("order_id", order_id)
        .execute()
        .data
    )
    return {**order, "items": items}


def list_orders_by_email(customer_email: str) -> list[dict]:
    res = (
        supabase.table("orders")
        .select("*")
        .eq("customer_email", customer_email)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


def cancel_order(order_id: int) -> tuple[bool, str]:
    from app.config import RESTAURANT_SUPPORT_PHONE

    status = get_order_status(order_id)
    if status is None:
        return False, "سفارشی با این شماره پیدا نشد."
    if status == "pending":
        supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id).execute()
        return True, "سفارش شما با موفقیت لغو شد."
    if status in ("cooking", "completed"):
        return False, (
            "سفارش شما وارد مرحله آماده‌سازی/تحویل شده و امکان لغو خودکار وجود ندارد. "
            f"لطفاً مستقیماً با رستوران به شماره {RESTAURANT_SUPPORT_PHONE} تماس بگیرید تا تیم انسانی بررسی کند."
        )
    if status == "cancelled":
        return False, "این سفارش قبلاً لغو شده است."
    return False, f"وضعیت سفارش نامشخص است: {status}"


# ---------------------------------------------------------------------------
# Conversation / message-limit — سقف ۱۰ پیام در روز، جدا برای هر کاربر
#
# جداسازی کاربران: thread_id همیشه برابر str(user_id) است (در routers/chat.py ساخته می‌شود)
# و conversations.thread_id کلید اصلی جدول است — پس هر کاربر دقیقاً یک ردیف مخصوص خودش
# دارد و هرگز شمارنده یا حافظه‌اش با کاربر دیگر قاطی نمی‌شود. LangGraph هم با همین
# thread_id تاریخچه‌ی چت را جدا نگه می‌دارد (chat_memory.db)، و سبد خرید هم بر اساس همین
# user_id از هم جدا است (get_or_create_active_cart). یعنی سه isolation مستقل — پیام‌شمار
# روزانه، حافظه‌ی گفتگو، و سبد خرید — همه کلیدشان user_id/thread_id است.
# ---------------------------------------------------------------------------

def _today() -> str:
    return date.today().isoformat()


def get_or_create_conversation(thread_id: str, user_id: int) -> dict:
    res = supabase.table("conversations").select("*").eq("thread_id", thread_id).execute()
    if res.data:
        return res.data[0]
    created = supabase.table("conversations").insert(
        {"thread_id": thread_id, "user_id": user_id, "message_count": 0, "message_date": _today()}
    ).execute()
    return created.data[0]


def get_conversation_for_today(thread_id: str, user_id: int) -> dict:
    """
    گفتگوی «امروزِ» این کاربر را برمی‌گرداند. اگر آخرین باری که پیام فرستاده بود
    روز دیگری بوده، شمارنده را خودکار صفر و وضعیت را open می‌کند — یعنی سقف واقعاً
    روزانه است، نه یک‌بار برای همیشه.
    """
    convo = get_or_create_conversation(thread_id, user_id)
    if convo["message_date"] != _today():
        convo = (
            supabase.table("conversations")
            .update({"message_count": 0, "status": "open", "message_date": _today()})
            .eq("thread_id", thread_id)
            .execute()
            .data[0]
        )
    return convo


def register_user_message(thread_id: str, user_id: int) -> dict:
    """هر بار که پیام کاربر می‌رسد صدا زده می‌شود؛ اگر از سقف امروز رد شد، status به limited می‌رود."""
    convo = get_conversation_for_today(thread_id, user_id)
    new_count = convo["message_count"] + 1
    new_status = "limited" if new_count >= MAX_MESSAGES_PER_DAY else convo["status"]
    updated = (
        supabase.table("conversations")
        .update({"message_count": new_count, "status": new_status})
        .eq("thread_id", thread_id)
        .execute()
    )
    return updated.data[0]


def reset_conversation(thread_id: str) -> None:
    """ریست دستی (دکمه «گفتگوی جدید» در فرانت) — سقف روزانه باز هم مستقل از این خودکار اعمال می‌شود."""
    supabase.table("conversations").update(
        {"message_count": 0, "status": "open", "message_date": _today()}
    ).eq("thread_id", thread_id).execute()
