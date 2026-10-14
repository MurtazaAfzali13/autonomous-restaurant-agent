import time
import logging
from datetime import date, datetime
from zoneinfo import ZoneInfo

import httpx
from supabase import create_client, Client

from app.config import (
    SUPABASE_URL, SUPABASE_SERVICE_KEY, MAX_MESSAGES_PER_DAY,
    APP_TIMEZONE, RESTAURANT_SUPPORT_PHONE,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client lifecycle (lifespan صدا می‌زند؛ موقع import هیچ اتصالی ساخته نمی‌شود)
# ---------------------------------------------------------------------------
_client: Client | None = None


def init_client() -> None:
    global _client
    _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def close_client() -> None:
    global _client
    if _client is not None:
        try:
            _client.postgrest.session.close()  # httpx.Client زیرین
        except Exception:
            logger.debug("Supabase session close failed", exc_info=True)
        _client = None


def sb() -> Client:
    if _client is None:
        raise RuntimeError("Supabase client is not initialized (lifespan didn't run).")
    return _client


def ping() -> None:
    _execute(sb().table("meals").select("id").limit(1))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
# فقط خطاهایی که مطمئنیم درخواست هنوز اثری نداشته retry می‌شوند (اتصال idle بسته‌شده /
# اتصال برقرار نشده)؛ ReadTimeout را عمداً retry نمی‌کنیم چون insert ممکن است دوبار ثبت شود.
_RETRYABLE = (httpx.RemoteProtocolError, httpx.ConnectError)


def _execute(query, retries: int = 2):
    last_err = None
    for attempt in range(retries + 1):
        try:
            return query.execute()
        except _RETRYABLE as e:
            last_err = e
            logger.warning("Supabase transient error (attempt %d): %s", attempt + 1, type(e).__name__)
            time.sleep(0.3 * (attempt + 1))
    raise last_err


def _first(query) -> dict | None:
    """
    جایگزین .single(): در supabase-py، .single() وقتی ردیفی نباشد exception پرتاب می‌کند
    (نه None)، و باعث می‌شد «غذا پیدا نشد» به‌غلط «دیتابیس در دسترس نیست» نمایش داده شود.
    """
    res = _execute(query.limit(1))
    return res.data[0] if res.data else None


_TZ = ZoneInfo(APP_TIMEZONE)


def today_str() -> str:
    return datetime.now(_TZ).date().isoformat()


# ---------------------------------------------------------------------------
# Meals / Menu
# ---------------------------------------------------------------------------
MENU_LIMIT = 30  # جلوگیری از پر شدن context با منوی خیلی بزرگ


def search_meals(category: str | None = None, search_term: str | None = None) -> list[dict]:
    query = sb().table("meals").select("id, title, summary, price, category, image")
    if category:
        query = query.ilike("category", f"%{category}%")
    if search_term:
        query = query.ilike("title", f"%{search_term}%")
    return _execute(query.limit(MENU_LIMIT)).data


def get_meal(meal_id: int) -> dict | None:
    return _first(sb().table("meals").select("*").eq("id", meal_id))


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
def get_or_create_active_cart(user_id: int) -> dict:
    # توصیه: در Postgres یک unique partial index بگذارید تا دو درخواست هم‌زمان دو سبد active نسازند:
    #   create unique index one_active_cart_per_user on carts(user_id) where status = 'active';
    res = _execute(sb().table("carts").select("*").eq("user_id", user_id).eq("status", "active"))
    if res.data:
        return res.data[0]
    try:
        return _execute(sb().table("carts").insert({"user_id": user_id, "status": "active"})).data[0]
    except Exception as e:
        if getattr(e, "code", None) == "23505":  # unique index: درخواست هم‌زمان قبلاً ساخته
            return _execute(sb().table("carts").select("*").eq("user_id", user_id).eq("status", "active")).data[0]
        raise


def get_cart_items(user_id: int) -> list[dict]:
    cart = get_or_create_active_cart(user_id)
    query = (
        sb().table("cart_items")
        .select("id, meal_id, quantity, price, meals(title)")
        .eq("cart_id", cart["id"])
    )
    return _execute(query).data


def add_cart_item(user_id: int, meal_id: int, quantity: int = 1) -> dict:
    if quantity < 1 or quantity > 50:
        raise ValueError("invalid_quantity")
    cart = get_or_create_active_cart(user_id)
    meal = get_meal(meal_id)
    if not meal:
        raise ValueError("meal_not_found")

    existing = _execute(
        sb().table("cart_items").select("*").eq("cart_id", cart["id"]).eq("meal_id", meal_id)
    )
    if existing.data:
        item = existing.data[0]
        update_query = (
            sb().table("cart_items")
            .update({"quantity": item["quantity"] + quantity})
            .eq("id", item["id"])
        )
        return _execute(update_query).data[0]

    insert_query = sb().table("cart_items").insert(
        {"cart_id": cart["id"], "meal_id": meal_id, "quantity": quantity, "price": meal["price"]}
    )
    return _execute(insert_query).data[0]


def remove_cart_item(user_id: int, meal_id: int) -> None:
    cart = get_or_create_active_cart(user_id)
    _execute(sb().table("cart_items").delete().eq("cart_id", cart["id"]).eq("meal_id", meal_id))


def clear_cart(cart_id: int) -> None:
    _execute(sb().table("cart_items").delete().eq("cart_id", cart_id))


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
def create_order_from_cart(user_id: int, customer_name: str, customer_email: str) -> dict:
    """کل عملیات داخل یک Postgres function (تراکنش اتمی) انجام می‌شود؛ migrations/001 را ببینید."""
    try:
        res = _execute(sb().rpc("create_order_from_cart", {
            "p_user_id": user_id,
            "p_customer_name": customer_name,
            "p_customer_email": customer_email,
        }))
    except Exception as e:
        if "empty_cart" in str(e):
            raise ValueError("empty_cart") from e
        raise
    return res.data[0] if isinstance(res.data, list) else res.data


def get_order_for_user(order_id: int, user_id: int) -> dict | None:
    """سفارش فقط اگر مال همین کاربر باشد. «وجود ندارد» و «مال دیگری است» یکسان None می‌دهند (جلوگیری از enumeration)."""
    return _first(sb().table("orders").select("*").eq("id", order_id).eq("user_id", user_id))


def get_order_status(order_id: int, user_id: int) -> str | None:
    order = get_order_for_user(order_id, user_id)
    return order["status"] if order else None


def get_order_with_items(order_id: int, user_id: int) -> dict | None:
    order = get_order_for_user(order_id, user_id)
    if not order:
        return None
    query = (
        sb().table("order_items")
        .select("id, meal_id, quantity, price, meals(title)")
        .eq("order_id", order_id)
    )
    return {**order, "items": _execute(query).data}


def list_orders_for_user(user_id: int) -> list[dict]:
    query = (
        sb().table("orders").select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
    )
    return _execute(query).data


def cancel_order(order_id: int, user_id: int) -> tuple[bool, str]:
    order = get_order_for_user(order_id, user_id)
    if order is None:
        return False, "No order found with that number."
    status = order["status"]
    if status == "pending":
        # شرط status داخل خود update: اگر هم‌زمان cooking شد، لغو نمی‌شود
        res = _execute(
            sb().table("orders").update({"status": "cancelled"})
            .eq("id", order_id).eq("user_id", user_id).eq("status", "pending")
        )
        if res.data:
            return True, "Your order was cancelled successfully."
        return False, f"The order just moved to preparation. Please contact the restaurant at {RESTAURANT_SUPPORT_PHONE}."
    if status in ("cooking", "completed"):
        return False, (
            "Your order is already being prepared/delivered, so it can't be cancelled automatically. "
            f"Please contact the restaurant directly at {RESTAURANT_SUPPORT_PHONE} so our staff can assist."
        )
    if status == "cancelled":
        return False, "This order has already been cancelled."
    return False, f"Unknown order status: {status}"


# ---------------------------------------------------------------------------
# Rooms / Reservations
# ---------------------------------------------------------------------------
def search_available_rooms(check_in: str, check_out: str, guests: int = 1) -> list[dict]:
    rooms = _execute(
        sb().table("rooms")
        .select("id, name, type, summary, price_per_night, capacity, beds, size_m2, view")
        .eq("is_active", True)
        .gte("capacity", guests)
        .limit(50)
    ).data

    # [check_in, check_out) overlap: existing.check_in < req.check_out AND existing.check_out > req.check_in
    conflicts = _execute(
        sb().table("reservations")
        .select("room_id")
        .in_("status", ["pending", "confirmed", "checked_in"])
        .lt("check_in", check_out)
        .gt("check_out", check_in)
    ).data
    busy = {r["room_id"] for r in conflicts}
    return [r for r in rooms if r["id"] not in busy]


def get_room(room_id: int) -> dict | None:
    return _first(sb().table("rooms").select("*").eq("id", room_id).eq("is_active", True))


def get_reservation(reservation_id: int, user_id: int) -> dict | None:
    """فقط رزرو خود کاربر؛ در غیر این صورت None."""
    return _first(
        sb().table("reservations").select("*, rooms(name, price_per_night)")
        .eq("id", reservation_id).eq("user_id", user_id)
    )


def get_user_reservations(user_id: int) -> list[dict]:
    query = (
        sb().table("reservations")
        .select("*, rooms(name, price_per_night)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
    )
    return _execute(query).data


def create_reservation(
    user_id: int, room_id: int, check_in: str, check_out: str,
    adults: int = 1, children: int = 0,
) -> tuple[dict | None, str | None]:
    room = get_room(room_id)
    if not room:
        return None, "No room found with that id."

    try:
        nights = (date.fromisoformat(check_out) - date.fromisoformat(check_in)).days
        check_in_date = date.fromisoformat(check_in)
    except ValueError:
        return None, "Dates must be in YYYY-MM-DD format."

    if check_in_date < date.fromisoformat(today_str()):
        return None, "The check-in date can't be in the past."
    if nights < 1 or nights > 30:
        return None, "The stay must be between 1 and 30 nights."
    if adults < 1 or children < 0 or adults + children > room["capacity"]:
        return None, "The number of guests exceeds this room's capacity."

    payload = {
        "user_id": user_id,
        "room_id": room_id,
        "check_in": check_in,
        "check_out": check_out,
        "adults": adults,
        "children": children,
        "price_per_night": room["price_per_night"],
        "total_price": nights * float(room["price_per_night"]),
        "status": "pending",
    }

    try:
        return _execute(sb().table("reservations").insert(payload)).data[0], None
    except Exception as e:
        code = getattr(e, "code", None)
        logger.error(
            "create_reservation failed: code=%s message=%s details=%s hint=%s payload=%s",
            code, getattr(e, "message", None) or str(e), getattr(e, "details", None),
            getattr(e, "hint", None), payload,
        )
        if code == "23P01" or "no_double_booking" in str(e).lower():
            return None, "That date range was just booked by someone else. Please choose different dates."
        if code == "23503":
            return None, "Your account couldn't be linked to this booking. Please log in and try again."
        if code == "428C9":
            return None, "A reservation column is generated by the database and cannot be set manually."
        return None, f"Couldn't create the reservation right now ({type(e).__name__}). Please try again in a moment."


def get_reservation_status(reservation_id: int, user_id: int) -> str | None:
    reservation = get_reservation(reservation_id, user_id)
    return reservation["status"] if reservation else None


def cancel_reservation(reservation_id: int, user_id: int) -> tuple[bool, str]:
    """
    status                  | check-in date        | cancellable automatically?
    pending / confirmed     | still in the future  | YES -> "cancelled"
    pending / confirmed     | today or past        | NO  -> contact the hotel
    checked_in / completed  | (irrelevant)         | NO  -> contact the hotel
    cancelled / no_show     | (irrelevant)         | NO  -> already resolved
    """
    reservation = get_reservation(reservation_id, user_id)
    if not reservation:
        return False, "No reservation found with that number."

    status = reservation["status"]

    if status in ("pending", "confirmed") and reservation["check_in"] > today_str():
        _execute(
            sb().table("reservations").update({"status": "cancelled"})
            .eq("id", reservation_id).eq("user_id", user_id).in_("status", ["pending", "confirmed"])
        )
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
    return False, (
        "This reservation's check-in date has already passed or is today, so it can't be cancelled automatically. "
        f"Please contact the hotel directly at {RESTAURANT_SUPPORT_PHONE}."
    )


# ---------------------------------------------------------------------------
# Daily message cap (اتمی، سمت دیتابیس؛ هیچ مسیر ریستی وجود ندارد)
# ---------------------------------------------------------------------------
def consume_daily_message(user_id: int) -> int:
    """
    یک پیام از سهمیه‌ی امروز کم می‌کند. برمی‌گرداند: تعداد مصرف‌شده‌ی امروز (۱..سقف)،
    یا -1 اگر سقف پر باشد. منطق در Postgres function است تا درخواست‌های هم‌زمان نتوانند دورش بزنند.
    """
    res = _execute(sb().rpc("consume_daily_message", {
        "p_user_id": user_id,
        "p_today": today_str(),
        "p_limit": MAX_MESSAGES_PER_DAY,
    }))
    return int(res.data)
