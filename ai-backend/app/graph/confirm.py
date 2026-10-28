from langchain_core.messages import AIMessage
from langgraph.types import interrupt
from app.graph.state import AgentState
from app import db

_YES = ("yes", "y", "confirm", "بله", "آره", "تایید")


def confirm_checkout_node(state: AgentState):
    """
    فقط وقتی اجرا می‌شود که request_checkout در نود tools کامل commit شده باشد؛ پس interrupt()
    همیشه در یک task مستقل و تک‌منظوره است.
    چون گفتگو ماندگار است، کاربر ممکن است ساعت‌ها بعد «yes» بزند. قبل از ثبت، سبد زنده با همان
    چیزی که کاربر تایید کرده مقایسه می‌شود؛ اگر فرق کند سفارشی ثبت نمی‌شود.
    """
    pending = state["pending_checkout"]

    user_response = interrupt({
        "type": "confirm_checkout",
        "summary": pending["summary"],
        "total": pending["total"],
        "question": f"Your cart:\n{pending['summary']}\nTotal: ${pending['total']}\nShall I place the order? (yes/no)",
    })

    last_order_id = state.get("last_order_id")
    if str(user_response).strip().lower() in _YES:
        try:
            live_items = db.get_cart_items(pending["user_id"])
            live_lines = [f"- {i['meals']['title']} × {i['quantity']}" for i in live_items]
            live_total = sum(i["price"] * i["quantity"] for i in live_items)
            # ترتیب ردیف‌ها در دیتابیس تضمین‌شده نیست؛ پس مرتب‌شده مقایسه می‌کنیم.
            changed = (
                sorted(live_lines) != sorted(pending["summary"].splitlines())
                or abs(float(live_total) - float(pending["total"])) > 0.005
            )
            if changed:
                content = (
                    "Your cart changed after I asked you to confirm, so I did not place the order. "
                    "Please review your cart and ask me to check out again."
                )
            else:
                order = db.create_order_from_cart(
                    pending["user_id"], pending["customer_name"], pending["customer_email"]
                )
                content = f"🎉 Order placed! Your order number is: {order['id']}"
                last_order_id = order["id"]
        except ValueError:
            content = "Your cart is empty now, so there is nothing to order."
        except Exception as e:
            content = f"Couldn't place the order right now due to a database issue ({type(e).__name__}). Please try again in a moment."
    else:
        content = "Checkout cancelled. Your cart was left untouched."

    return {
        "messages": [AIMessage(content=content)],
        "pending_checkout": None,
        "last_order_id": last_order_id,
    }


def confirm_room_booking_node(state: AgentState):
    """
    همان الگو برای رزرو اتاق. قبل از ثبت، قیمت زنده‌ی اتاق با مبلغی که کاربر تایید کرده مقایسه می‌شود
    (تداخل تاریخ را خود دیتابیس با constraint جلوگیری می‌کند).
    """
    pending = state["pending_room_booking"]

    user_response = interrupt({
        "type": "confirm_room_booking",
        "room_name": pending["room_name"],
        "check_in": pending["check_in"],
        "check_out": pending["check_out"],
        "nights": pending["nights"],
        "total": pending["total"],
        "question": (
            f"Room: {pending['room_name']}\n"
            f"{pending['check_in']} to {pending['check_out']} ({pending['nights']} night(s))\n"
            f"Total: ${pending['total']}\nShall I confirm this booking? (yes/no)"
        ),
    })

    last_reservation_id = state.get("last_reservation_id")
    if str(user_response).strip().lower() in _YES:
        try:
            room = db.get_room(pending["room_id"])
            if not room:
                content = "❌ This room is no longer available."
            elif abs(pending["nights"] * float(room["price_per_night"]) - float(pending["total"])) > 0.005:
                content = (
                    "The room's price changed after I asked you to confirm, so I did not book it. "
                    "Please ask me to book again to see the new total."
                )
            else:
                reservation, error = db.create_reservation(
                    pending["user_id"], pending["room_id"], pending["check_in"],
                    pending["check_out"], pending["adults"], pending["children"],
                )
                if error:
                    content = f"❌ {error}"
                else:
                    content = (
                        f"🎉 Booking requested! Your reservation number is: {reservation['id']} "
                        f"(pending confirmation from our staff)."
                    )
                    last_reservation_id = reservation["id"]
        except Exception as e:
            content = f"❌ a database issue ({type(e).__name__})"
    else:
        content = "Booking cancelled. No dates were held for you."

    return {
        "messages": [AIMessage(content=content)],
        "pending_room_booking": None,
        "last_reservation_id": last_reservation_id,
    }
