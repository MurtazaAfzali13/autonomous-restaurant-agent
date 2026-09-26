import time
from datetime import date
import httpx
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, MAX_MESSAGES_PER_DAY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _execute(query, retries: int = 2):
    """
    Supabase's underlying HTTP client keeps connections pooled and reuses them
    across requests. Occasionally the server has already closed an idle pooled
    connection, and the next request that reuses it fails with
    httpx.RemoteProtocolError: Server disconnected. This is a transient network
    condition, not a broken query — retry a couple of times before giving up.
    """
    last_err = None
    for attempt in range(retries + 1):
        try:
            return query.execute()
        except httpx.RemoteProtocolError as e:
            last_err = e
            time.sleep(0.3 * (attempt + 1))
    raise last_err


# ---------------------------------------------------------------------------
# Meals / Menu
# ---------------------------------------------------------------------------

def search_meals(category: str | None = None, search_term: str | None = None) -> list[dict]:
    query = supabase.table("meals").select("id, title, summary, price, category, image")
    if category:
        query = query.ilike("category", f"%{category}%")
    if search_term:
        query = query.ilike("title", f"%{search_term}%")
    return _execute(query).data


def get_meal(meal_id: int) -> dict | None:
    query = supabase.table("meals").select("*").eq("id", meal_id).single()
    return _execute(query).data


# ---------------------------------------------------------------------------
# Cart — همه‌ی عملیات سبد خرید از همین‌جا رد می‌شود، چه چت‌بات چه هر endpoint دیگر.
# این باعث می‌شود فرانت و چت‌بات هرگز از هم عقب نیفتند.
# ---------------------------------------------------------------------------

def get_or_create_active_cart(user_id: int) -> dict:
    query = supabase.table("carts").select("*").eq("user_id", user_id).eq("status", "active")
    res = _execute(query)
    if res.data:
        return res.data[0]
    created = _execute(supabase.table("carts").insert({"user_id": user_id, "status": "active"}))
    return created.data[0]


def get_cart_items(user_id: int) -> list[dict]:
    cart = get_or_create_active_cart(user_id)
    query = (
        supabase.table("cart_items")
        .select("id, meal_id, quantity, price, meals(title)")
        .eq("cart_id", cart["id"])
    )
    return _execute(query).data


def add_cart_item(user_id: int, meal_id: int, quantity: int = 1) -> dict:
    cart = get_or_create_active_cart(user_id)
    meal = get_meal(meal_id)
    if not meal:
        raise ValueError("meal_not_found")

    existing_query = (
        supabase.table("cart_items")
        .select("*")
        .eq("cart_id", cart["id"])
        .eq("meal_id", meal_id)
    )
    existing = _execute(existing_query)
    if existing.data:
        item = existing.data[0]
        update_query = (
            supabase.table("cart_items")
            .update({"quantity": item["quantity"] + quantity})
            .eq("id", item["id"])
        )
        return _execute(update_query).data[0]

    insert_query = supabase.table("cart_items").insert(
        {"cart_id": cart["id"], "meal_id": meal_id, "quantity": quantity, "price": meal["price"]}
    )
    return _execute(insert_query).data[0]


def remove_cart_item(user_id: int, meal_id: int) -> None:
    cart = get_or_create_active_cart(user_id)
    query = supabase.table("cart_items").delete().eq("cart_id", cart["id"]).eq("meal_id", meal_id)
    _execute(query)


def clear_cart(cart_id: int) -> None:
    _execute(supabase.table("cart_items").delete().eq("cart_id", cart_id))


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

def create_order_from_cart(user_id: int, customer_name: str, customer_email: str) -> dict:
    cart = get_or_create_active_cart(user_id)
    items = get_cart_items(user_id)
    if not items:
        raise ValueError("empty_cart")

    total_price = sum(i["price"] * i["quantity"] for i in items)

    order_query = supabase.table("orders").insert({
        "customer_name": customer_name,
        "customer_email": customer_email,
        "total_price": total_price,
        "status": "pending",
    })
    order = _execute(order_query).data[0]

    order_items_payload = [
        {"order_id": order["id"], "meal_id": i["meal_id"], "quantity": i["quantity"], "price": i["price"]}
        for i in items
    ]
    _execute(supabase.table("order_items").insert(order_items_payload))

    # سبد را خالی و کارت را checked_out می‌کنیم؛ همان لحظه فرانت (Realtime) خالی شدن سبد را می‌بیند
    clear_cart(cart["id"])
    _execute(supabase.table("carts").update({"status": "checked_out"}).eq("id", cart["id"]))

    return order


def get_order(order_id: int) -> dict | None:
    query = supabase.table("orders").select("*").eq("id", order_id).single()
    return _execute(query).data


def get_order_status(order_id: int) -> str | None:
    order = get_order(order_id)
    return order["status"] if order else None


def get_order_with_items(order_id: int) -> dict | None:
    order = get_order(order_id)
    if not order:
        return None
    query = (
        supabase.table("order_items")
        .select("id, meal_id, quantity, price, meals(title)")
        .eq("order_id", order_id)
    )
    items = _execute(query).data
    return {**order, "items": items}


def list_orders_by_email(customer_email: str) -> list[dict]:
    query = (
        supabase.table("orders")
        .select("*")
        .eq("customer_email", customer_email)
        .order("created_at", desc=True)
    )
    return _execute(query).data


def cancel_order(order_id: int) -> tuple[bool, str]:
    from app.config import RESTAURANT_SUPPORT_PHONE

    status = get_order_status(order_id)
    if status is None:
        return False, "No order found with that number."
    if status == "pending":
        _execute(supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id))
        return True, "Your order was cancelled successfully."
    if status in ("cooking", "completed"):
        return False, (
            "Your order is already being prepared/delivered, so it can't be cancelled automatically. "
            f"Please contact the restaurant directly at {RESTAURANT_SUPPORT_PHONE} so our staff can assist."
        )
    if status == "cancelled":
        return False, "This order has already been cancelled."
    return False, f"Unknown order status: {status}"


# ---------------------------------------------------------------------------
# Rooms & Reservations
#
# Mirrors the exact same design as Orders above: availability is computed live
# from the database (never trusted from the model), price is always calculated
# server-side from the room's real price_per_night (never from what the user
# says), and cancellation follows one strict rule table — see cancel_reservation.
# No custom Postgres RPC is required: availability is computed with two plain
# queries (active rooms with enough capacity, minus rooms with an overlapping
# reservation), so this works against the schema as-is.
# ---------------------------------------------------------------------------

def search_available_rooms(check_in: str, check_out: str, guests: int = 1) -> list[dict]:
    rooms_query = (
        supabase.table("rooms")
        .select("id, name, type, summary, price_per_night, capacity, beds, size_m2, view")
        .eq("is_active", True)
        .gte("capacity", guests)
    )
    rooms = _execute(rooms_query).data

    # A reservation blocks a room for [check_in, check_out) — two ranges overlap
    # when existing.check_in < requested.check_out AND existing.check_out > requested.check_in.
    conflicts_query = (
        supabase.table("reservations")
        .select("room_id")
        .in_("status", ["pending", "confirmed", "checked_in"])
        .lt("check_in", check_out)
        .gt("check_out", check_in)
    )
    busy_room_ids = {r["room_id"] for r in _execute(conflicts_query).data}

    return [r for r in rooms if r["id"] not in busy_room_ids]


def get_room(room_id: int) -> dict | None:
    query = supabase.table("rooms").select("*").eq("id", room_id).eq("is_active", True).single()
    return _execute(query).data


def get_reservation(reservation_id: int) -> dict | None:
    query = (
        supabase.table("reservations")
        .select("*, rooms(name, price_per_night)")
        .eq("id", reservation_id)
        .single()
    )
    return _execute(query).data


def get_user_reservations(user_id: int) -> list[dict]:
    query = (
        supabase.table("reservations")
        .select("*, rooms(name, price_per_night)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
    )
    return _execute(query).data


def create_reservation(
    user_id: int, room_id: int, check_in: str, check_out: str,
    adults: int = 1, children: int = 0,
) -> tuple[dict | None, str | None]:
    """
    Same contract as create_order_from_cart: price is always computed here from
    the room's real price_per_night, never trusted from the caller. Returns
    (reservation, None) on success or (None, error_message) on a handled failure —
    it never raises for an expected business-rule failure, only for a genuinely
    unexpected error (which the calling tool still catches, per our
    no-tool-ever-raises rule).
    """
    from datetime import date as _date

    room = get_room(room_id)
    if not room:
        return None, "No room found with that id."

    try:
        nights = (_date.fromisoformat(check_out) - _date.fromisoformat(check_in)).days
    except ValueError:
        return None, "Dates must be in YYYY-MM-DD format."

    if nights < 1 or nights > 30:
        return None, "The stay must be between 1 and 30 nights."
    if adults + children > room["capacity"]:
        return None, "The number of guests exceeds this room's capacity."

    total_price = nights * float(room["price_per_night"])

    insert_query = supabase.table("reservations").insert({
        "user_id": user_id,
        "room_id": room_id,
        "check_in": check_in,
        "check_out": check_out,
        "adults": adults,
        "children": children,
        "nights": nights,
        "price_per_night": room["price_per_night"],
        "total_price": total_price,
        "status": "pending",
    })
    try:
        inserted = _execute(insert_query)
        return inserted.data[0], None
    except Exception as e:
        # Postgres 23P01 = exclusion constraint violation: someone else booked
        # this exact overlap in the instant between our availability check and insert.
        if "23P01" in str(e) or "no_double_booking" in str(e).lower():
            return None, "That date range was just booked by someone else. Please choose different dates."
        return None, f"Couldn't create the reservation right now ({type(e).__name__}). Please try again in a moment."


def get_reservation_status(reservation_id: int) -> str | None:
    reservation = get_reservation(reservation_id)
    return reservation["status"] if reservation else None


def cancel_reservation(reservation_id: int) -> tuple[bool, str]:
    """
    Cancellation eligibility — the one rule table that governs every cancel,
    whether triggered by the chatbot or a website button:

    status                  | check-in date        | cancellable automatically?
    -------------------------|-----------------------|---------------------------
    pending / confirmed      | still in the future   | YES -> becomes "cancelled"
    pending / confirmed      | today or already past | NO  -> contact the hotel
    checked_in / completed   | (irrelevant)          | NO  -> contact the hotel
    cancelled                | (irrelevant)          | NO  -> already cancelled
    no_show                  | (irrelevant)          | NO  -> already resolved
    """
    from app.config import RESTAURANT_SUPPORT_PHONE

    reservation = get_reservation(reservation_id)
    if not reservation:
        return False, "No reservation found with that number."

    status = reservation["status"]
    today = _today()

    if status in ("pending", "confirmed") and reservation["check_in"] > today:
        _execute(supabase.table("reservations").update({"status": "cancelled"}).eq("id", reservation_id))
        return True, "Your reservation was cancelled successfully."
    if status in ("checked_in", "completed"):
        return False, (
            "This reservation is already checked in or completed, so it can't be cancelled automatically. "
            f"Please contact the hotel directly at {RESTAURANT_SUPPORT_PHONE} so our staff can assist."
        )
    if status == "cancelled":
        return False, "This reservation has already been cancelled."
    if status == "no_show":
        return False, "This reservation was already marked as a no-show and can't be cancelled."
    # pending/confirmed but check-in is today or already in the past
    return False, (
        "This reservation's check-in date has already passed or is today, so it can't be cancelled automatically. "
        f"Please contact the hotel directly at {RESTAURANT_SUPPORT_PHONE}."
    )


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
    query = supabase.table("conversations").select("*").eq("thread_id", thread_id)
    res = _execute(query)
    if res.data:
        return res.data[0]
    insert_query = supabase.table("conversations").insert(
        {"thread_id": thread_id, "user_id": user_id, "message_count": 0, "message_date": _today()}
    )
    return _execute(insert_query).data[0]


def get_conversation_for_today(thread_id: str, user_id: int) -> dict:
    """
    گفتگوی «امروزِ» این کاربر را برمی‌گرداند. اگر آخرین باری که پیام فرستاده بود
    روز دیگری بوده، شمارنده را خودکار صفر و وضعیت را open می‌کند — یعنی سقف واقعاً
    روزانه است، نه یک‌بار برای همیشه.
    """
    convo = get_or_create_conversation(thread_id, user_id)
    if convo["message_date"] != _today():
        update_query = (
            supabase.table("conversations")
            .update({"message_count": 0, "status": "open", "message_date": _today()})
            .eq("thread_id", thread_id)
        )
        convo = _execute(update_query).data[0]
    return convo


def register_user_message(thread_id: str, user_id: int) -> dict:
    """هر بار که پیام کاربر می‌رسد صدا زده می‌شود؛ اگر از سقف امروز رد شد، status به limited می‌رود."""
    convo = get_conversation_for_today(thread_id, user_id)
    new_count = convo["message_count"] + 1
    new_status = "limited" if new_count >= MAX_MESSAGES_PER_DAY else convo["status"]
    update_query = (
        supabase.table("conversations")
        .update({"message_count": new_count, "status": new_status})
        .eq("thread_id", thread_id)
    )
    return _execute(update_query).data[0]


def reset_conversation(thread_id: str) -> None:
    """ریست دستی (دکمه «گفتگوی جدید» در فرانت) — سقف روزانه باز هم مستقل از این خودکار اعمال می‌شود."""
    query = supabase.table("conversations").update(
        {"message_count": 0, "status": "open", "message_date": _today()}
    ).eq("thread_id", thread_id)
    _execute(query)
