from typing import Annotated, TypedDict, Optional
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: int
    customer_name: str
    customer_email: str
    thread_id: str
    cart_snapshot: list[dict]
    last_order_id: Optional[int]
