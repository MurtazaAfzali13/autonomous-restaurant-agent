"""
بررسی یک‌دستوری: آیا زنجیره‌ی «کارت غذا» در بک‌اند سالم است؟  (بدون دیتابیس و بدون LLM)
اجرا از ریشه‌ی ai-backend با venv فعال:
    python scripts/check_cards.py
فایل ابزاری که agent واقعاً استفاده می‌کند را خودش پیدا می‌کند (هر ساختاری که داشته باشید).
"""
import sys
import inspect
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import importlib.metadata as md
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from app import db
from app.graph.cards import collect_turn_cards

results: list[bool] = []


def check(name: str, ok: bool, hint: str = ""):
    results.append(ok)
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok else f"   <- {hint}"))


def read(rel: str) -> str:
    p = ROOT / rel
    return p.read_text(encoding="utf-8") if p.exists() else ""


def src_of(t) -> str:
    f = getattr(t, "func", None) or getattr(t, "coroutine", None)
    try:
        return str(Path(inspect.getsourcefile(f)).resolve().relative_to(ROOT))
    except Exception:
        return "?"


def finish():
    print("\n" + ("ALL BACKEND CHECKS PASSED -> if the card is still missing, the problem is in the frontend "
                  "files / Next.js cache (restart npm run dev, then Ctrl+F5)."
                  if all(results) else "Some checks FAILED -> fix the lines marked FAIL, restart uvicorn, run this again."))
    sys.exit(0 if all(results) else 1)


print("--- versions ---")
for pkg in ("langgraph", "langchain-core", "langgraph-checkpoint-sqlite"):
    try:
        print(f"{pkg}: {md.version(pkg)}")
    except Exception:
        print(f"{pkg}: ?")

print("\n--- file checks ---")
check("db.add_cart_item returns title/image", '"title": meal["title"]' in read("app/db.py"),
      "replace app/db.py with the new file")
check("routers/chat.py sends cards", "collect_turn_cards" in read("app/routers/chat.py"),
      "replace app/routers/chat.py with the new file")
check("agent.py prompt knows about cards", "photo" in read("app/graph/agent.py"),
      "replace app/graph/agent.py with the new file (recommended)")

print("\n--- the tools your agent REALLY uses ---")
try:
    from app.graph.tools import TOOLS
except Exception as e:
    check("app.graph.tools imports", False, f"{type(e).__name__}: {e}")
    finish()

for t in TOOLS:
    print(f"   {t.name:26s} -> {src_of(t)}")

mine = [t for t in TOOLS if t.name == "add_to_cart"]
check("add_to_cart is registered in TOOLS", len(mine) == 1, "tools package doesn't include add_to_cart")
if not mine:
    finish()
cart_tool = mine[0]
real = src_of(cart_tool)

check(f"'{real}' is the new version (content_and_artifact)",
      getattr(cart_tool, "response_format", None) == "content_and_artifact",
      f"OLD version in use -> copy the new cart_tools.py over '{real}'")

stray = Path("app/graph/cart_tools.py")
if (ROOT / stray).exists() and Path(real) != stray:
    print(f"      note: stray duplicate '{stray}' exists but is NOT used -> delete it (or Move-Item it over '{real}').")

IDENTITY = {"user_id", "customer_name", "customer_email"}
exposed = [(t.name, sorted(IDENTITY & set(t.tool_call_schema.model_json_schema().get("properties", {})))) for t in TOOLS]
exposed = [(n, a) for n, a in exposed if a]
check("no tool lets the MODEL choose user_id / customer_name / customer_email", not exposed,
      "old tool files in use: " + "; ".join(f"{n}{a}" for n, a in exposed))

print("\n--- runtime check with the REAL registered tool ---")
db.add_cart_item = lambda user_id, meal_id, quantity=1: {      # دیتابیس جعلی؛ چیزی در Supabase نوشته نمی‌شود
    "id": 1, "cart_id": 1, "meal_id": meal_id, "quantity": quantity,
    "price": 9.5, "title": "Test Salad", "image": "6.jpg",
}


class S(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: int


g = StateGraph(S)
g.add_node("tools", ToolNode([cart_tool]))
g.add_edge(START, "tools")
g.add_edge("tools", END)
app = g.compile()

msgs = app.invoke({
    "user_id": 4,
    "messages": [
        HumanMessage("add salad"),
        AIMessage("", tool_calls=[{"id": "c1", "name": "add_to_cart", "args": {"meal_id": 23, "quantity": 1}}]),
    ],
})["messages"]
tool_msg = msgs[-1]
print("tool content :", tool_msg.content)
print("tool artifact:", getattr(tool_msg, "artifact", None))
cards = collect_turn_cards(msgs)
check("a card is produced from the real tool", len(cards) == 1 and cards[0].get("title") == "Test Salad",
      "the tool ran but returned no artifact (see 'tool content' above)")
finish()
