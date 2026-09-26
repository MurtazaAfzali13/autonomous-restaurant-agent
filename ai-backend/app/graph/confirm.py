from langchain_core.messages import AIMessage
from langgraph.types import interrupt
from app.graph.state import AgentState
from app import db


def confirm_checkout_node(state: AgentState):
    """
    این نود فقط وقتی اجرا می‌شود که request_checkout در نود tools کامل و commit شده باشد
    (یعنی ToolMessage آن ابزار از قبل ثبت شده). پس interrupt() اینجا همیشه در یک task
    مستقل و تک‌منظوره اتفاق می‌افتد — هرگز در کنار یک tool_call دیگرِ حل‌نشده.
    """
    pending = state["pending_checkout"]

    user_response = interrupt({
        "type": "confirm_checkout",
        "summary": pending["summary"],
        "total": pending["total"],
        "question": f"Your cart:\n{pending['summary']}\nTotal: ${pending['total']}\nShall I place the order? (yes/no)",
    })

    if str(user_response).strip().lower() in ("yes", "y", "confirm", "بله", "آره", "تایید"):
        try:
            order = db.create_order_from_cart(
                pending["user_id"], pending["customer_name"], pending["customer_email"]
            )
            content = f"🎉 Order placed! Your order number is: {order['id']}"
            last_order_id = order["id"]
        except Exception as e:
            content = f"Couldn't place the order right now due to a database issue ({type(e).__name__}). Please try again in a moment."
            last_order_id = state.get("last_order_id")
    else:
        content = "Checkout cancelled. Your cart was left untouched."
        last_order_id = state.get("last_order_id")

    return {
        "messages": [AIMessage(content=content)],
        "pending_checkout": None,
        "last_order_id": last_order_id,
    }


def confirm_room_booking_node(state: AgentState):
    """
    همان الگوی confirm_checkout_node، برای رزرو اتاق. فقط بعد از این‌که
    request_room_booking در نود tools کامل commit شده اجرا می‌شود، پس اینجا هم
    interrupt() همیشه در یک task مستقل و تک‌منظوره است.
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

    if str(user_response).strip().lower() in ("yes", "y", "confirm", "بله", "آره", "تایید"):
        try:
            reservation, error = db.create_reservation(
                pending["user_id"],
                pending["room_id"],
                pending["check_in"],
                pending["check_out"],
                pending["adults"],
                pending["children"],
            )
        except Exception as e:
            reservation, error = None, f"a database issue ({type(e).__name__})"
        if error:
            content = f"❌ {error}"
            last_reservation_id = state.get("last_reservation_id")
        else:
            content = (
                f"🎉 Booking requested! Your reservation number is: {reservation['id']} "
                f"(pending confirmation from our staff)."
            )
            last_reservation_id = reservation["id"]
    else:
        content = "Booking cancelled. No dates were held for you."
        last_reservation_id = state.get("last_reservation_id")

    return {
        "messages": [AIMessage(content=content)],
        "pending_room_booking": None,
        "last_reservation_id": last_reservation_id,
    }
