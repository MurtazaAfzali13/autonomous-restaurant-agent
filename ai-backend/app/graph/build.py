import sqlite3
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver
from app.config import CHECKPOINT_DB_PATH
from app.graph.state import AgentState
from app.graph.agent import agent_node
from app.graph.confirm import confirm_checkout_node, confirm_room_booking_node
from app.graph.tools import TOOLS


def route_after_tools(state: AgentState) -> str:
    """
    اگر request_checkout یا request_room_booking در همین نوبت صدا زده شده باشد،
    مستقیم به نود confirm مربوطه برو تا آنجا — تنها و مستقل — interrupt() اجرا شود.
    وگرنه طبق روال عادی برگرد به agent. این دو حالت هرگز هم‌زمان پر نمی‌شوند چون
    parallel_tool_calls=False است، پس هر نوبت حداکثر یکی از این دو را صدا می‌زند.
    """
    if state.get("pending_checkout"):
        return "confirm_checkout"
    if state.get("pending_room_booking"):
        return "confirm_room_booking"
    return "agent"


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(TOOLS))
    graph.add_node("confirm_checkout", confirm_checkout_node)
    graph.add_node("confirm_room_booking", confirm_room_booking_node)

    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
    graph.add_conditional_edges(
        "tools",
        route_after_tools,
        {"confirm_checkout": "confirm_checkout", "confirm_room_booking": "confirm_room_booking", "agent": "agent"},
    )
    graph.add_edge("confirm_checkout", END)
    graph.add_edge("confirm_room_booking", END)

    conn = sqlite3.connect(CHECKPOINT_DB_PATH, check_same_thread=False)
    checkpointer = SqliteSaver(conn)

    return graph.compile(checkpointer=checkpointer)


compiled_graph = build_graph()
