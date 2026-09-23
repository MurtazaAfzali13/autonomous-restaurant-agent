import sqlite3
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver
from app.config import CHECKPOINT_DB_PATH
from app.graph.state import AgentState
from app.graph.agent import agent_node
from app.graph.tools import TOOLS


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(TOOLS))

    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    conn = sqlite3.connect(CHECKPOINT_DB_PATH, check_same_thread=False)
    checkpointer = SqliteSaver(conn)

    return graph.compile(checkpointer=checkpointer)


compiled_graph = build_graph()


if __name__ == "__main__":
    try:
        png_bytes = compiled_graph.get_graph().draw_mermaid_png()
        
        file_name = "mermaid.png"
        with open(file_name, "wb") as f:
            f.write(png_bytes)
            
        print(f"✅ ساختار گراف با موفقیت در فایل '{file_name}' ذخیره شد!")
        
    except Exception as e:
        print(f"❌ خطا در تولید عکس: {e}")
