from typing import Annotated, TypedDict, Optional
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: int
    customer_name: str
    customer_email: str
    thread_id: str
    # فقط یک snapshot برای دادن Context زنده به LLM است.
    # منبع واحد حقیقت (source of truth) همیشه دیتابیس است (cart_items / orders)،
    # نه این فیلد — به همین دلیل reducer تجمعی (operator.add) رویش نمی‌گذاریم.
    cart_snapshot: list[dict]
    last_order_id: Optional[int]
