from langchain_core.tools import tool
from langgraph.types import interrupt
from app import db


@tool
def request_checkout(user_id: int, customer_name: str, customer_email: str) -> str:
    """
    فقط وقتی صدا زده شود که کاربر صراحتاً گفته سفارش را نهایی/ثبت کن.
    اجرای گراف را متوقف می‌کند و منتظر پاسخ صریح کاربر (بله/خیر) می‌ماند — نقطه HITL.
    """
    items = db.get_cart_items(user_id)
    if not items:
        return "سبد خرید خالی است، چیزی برای ثبت نیست."

    total = sum(i["price"] * i["quantity"] for i in items)
    summary = "\n".join([f"- {i['meals']['title']} × {i['quantity']}" for i in items])

    # 🔴 نقطه HITL: اجرا اینجا متوقف می‌شود؛ routers/chat.py با Command(resume=...) ادامه‌اش می‌دهد
    user_response = interrupt({
        "type": "confirm_checkout",
        "summary": summary,
        "total": total,
        "question": f"سبد شما:\n{summary}\nجمع: ${total}\nثبت نهایی شود؟ (بله/خیر)",
    })

    if str(user_response).strip().lower() in ("بله", "yes", "آره", "تایید", "confirm"):
        order = db.create_order_from_cart(user_id, customer_name, customer_email)
        return f"🎉 سفارش ثبت شد. شماره سفارش شما: {order['id']}"
    return "ثبت سفارش لغو شد. سبد خرید شما دست‌نخورده باقی ماند."


@tool
def check_order_status(order_id: int) -> str:
    """بررسی وضعیت فعلی یک سفارش با شماره سفارش."""
    status = db.get_order_status(order_id)
    if status is None:
        return "سفارشی با این شماره پیدا نشد."
    fa = {
        "pending": "در انتظار تایید",
        "cooking": "در حال آماده‌سازی",
        "completed": "تحویل شده",
        "cancelled": "لغو شده",
    }
    return f"وضعیت سفارش {order_id}: {fa.get(status, status)}"


@tool
def cancel_order(order_id: int) -> str:
    """
    درخواست لغو یک سفارش. اگر سفارش هنوز pending باشد لغو می‌شود.
    اگر cooking یا completed شده باشد، لغو خودکار امکان‌پذیر نیست و کاربر
    به تماس با تیم انسانی رستوران راهنمایی می‌شود.
    """
    _, message = db.cancel_order(order_id)
    return message
