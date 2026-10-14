from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from app.config import (
    CHAT_MODEL, OPENROUTER_API_KEY, OPENROUTER_BASE_URL,
    LLM_TIMEOUT_SECONDS, LLM_MAX_RETRIES, MAX_CONTEXT_TURNS,
)
from app.graph.state import AgentState
from app.graph.tools import TOOLS
from app.graph.context import trim_to_last_turns
from app import db

llm = ChatOpenAI(
    model=CHAT_MODEL,
    api_key=OPENROUTER_API_KEY,
    base_url=OPENROUTER_BASE_URL,
    temperature=0.2,
    timeout=LLM_TIMEOUT_SECONDS,
    max_retries=LLM_MAX_RETRIES,
    default_headers={
        "HTTP-Referer": "https://your-restaurant-app.example",
        "X-Title": "Restaurant AI Backend",
    },
)
llm_with_tools = llm.bind_tools(TOOLS, parallel_tool_calls=False)


SYSTEM_PROMPT = """You are the hotel & restaurant's assistant. Answer precisely and concisely.
You can help with two separate things in the same conversation: food ordering and room booking.
Always reply in English only, even if the user writes in another language.
Today's date is {today}. Use it to resolve phrases like "tomorrow" or "next Friday" into YYYY-MM-DD.
You only see the most recent part of the conversation; if you need a detail from earlier
(cart, reservations), read it with the tools instead of guessing.

Food ordering rules:
- Before add_to_cart, always use search_menu first to find the exact meal id.
- Use view_cart to see the cart; never guess its contents.
- Only call request_checkout when the user explicitly says to place/finalize the order.
- For a cancellation request, first check the order's status with check_order_status, then
  call cancel_order and return its exact message to the user verbatim (especially when the
  order is already cooking/completed).

Room booking rules:
- Before request_room_booking, always use search_available_rooms first to find an open room
  and its exact room id for the requested dates and party size.
- Use list_my_reservations to see the user's reservations; never guess their contents.
- Only call request_room_booking when the user explicitly says to book/finalize this room.
- For a cancellation request, first check the reservation's status with check_reservation_status,
  then call cancel_reservation and return its exact message to the user verbatim (especially
  when the guest is already checked in, the stay is completed, or the check-in date has passed).

Current user: {customer_name}. Tools already know who the user is: never ask for, guess, or pass
user ids or emails, and only act on the current user's own orders and reservations.

Current food cart (live from the database):
{cart_snapshot}

Current room reservations (live from the database):
{reservation_snapshot}
"""


def agent_node(state: AgentState):
    cart = db.get_cart_items(state["user_id"])
    reservations = db.get_user_reservations(state["user_id"])

    cart_text = "\n".join([f"- {c['meals']['title']} × {c['quantity']}" for c in cart]) or "Empty."
    reservation_text = (
        "\n".join([f"- reservation {r['id']}: {r['rooms']['name']} ({r['status']})" for r in reservations])
        or "No reservations."
    )

    sys_msg = SystemMessage(content=SYSTEM_PROMPT.format(
        today=db.today_str(),
        user_id=state["user_id"],
        customer_name=state["customer_name"],
        customer_email=state["customer_email"],
        cart_snapshot=cart_text,
        reservation_snapshot=reservation_text,
    ))

    # state کامل در checkpointer می‌ماند؛ فقط پنجره‌ی اخیر به مدل می‌رود.
    window = trim_to_last_turns(state["messages"], MAX_CONTEXT_TURNS)
    response = llm_with_tools.invoke([sys_msg] + window)
    return {"messages": [response], "cart_snapshot": cart}
