from typing import Annotated
from langchain_core.tools import tool, InjectedToolCallId
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from app import db


@tool
def request_checkout(
    user_id: int,
    customer_name: str,
    customer_email: str,
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """
    Call this only when the user explicitly says to finalize/place the order.
    This does NOT place the order itself and does NOT pause the graph — it only
    records that checkout was requested. The actual yes/no pause (HITL) happens
    right after, in a dedicated graph node (confirm_checkout_node), never inside
    this tool. That separation is what keeps the chat history from getting
    corrupted, even if the model calls another tool in the same turn.
    """
    try:
        items = db.get_cart_items(user_id)
    except Exception as e:
        return Command(update={
            "messages": [ToolMessage(
                f"Couldn't read the cart from the database right now ({type(e).__name__}). Please try again in a moment.",
                tool_call_id=tool_call_id,
            )],
        })

    if not items:
        return Command(update={
            "messages": [ToolMessage("The cart is empty, there's nothing to place.", tool_call_id=tool_call_id)],
        })

    total = sum(i["price"] * i["quantity"] for i in items)
    summary = "\n".join([f"- {i['meals']['title']} × {i['quantity']}" for i in items])

    return Command(update={
        "messages": [ToolMessage("Checkout requested — waiting for the customer's confirmation.", tool_call_id=tool_call_id)],
        "pending_checkout": {
            "summary": summary,
            "total": total,
            "user_id": user_id,
            "customer_name": customer_name,
            "customer_email": customer_email,
        },
    })


@tool
def check_order_status(order_id: int) -> str:
    """Check the current status of an order by its order number."""
    try:
        status = db.get_order_status(order_id)
    except Exception as e:
        return f"Couldn't reach the database to check that order right now ({type(e).__name__}). Please try again in a moment."
    if status is None:
        return "No order found with that number."
    labels = {
        "pending": "pending confirmation",
        "cooking": "being prepared",
        "completed": "delivered",
        "cancelled": "cancelled",
    }
    return f"Order {order_id} status: {labels.get(status, status)}"


@tool
def cancel_order(order_id: int) -> str:
    """
    Request to cancel an order. Succeeds while the order is still pending.
    If it's already cooking or completed, automatic cancellation isn't possible and
    the customer is pointed to contact the restaurant's support line directly.
    """
    try:
        _, message = db.cancel_order(order_id)
        return message
    except Exception as e:
        return f"Couldn't reach the database to cancel that order right now ({type(e).__name__}). Please try again in a moment."
