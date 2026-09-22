from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from app.config import CHAT_MODEL, OPENROUTER_API_KEY, OPENROUTER_BASE_URL
from app.graph.state import AgentState
from app.graph.tools import TOOLS
from app import db

# langchain-openai کاملاً با OpenRouter سازگار است، فقط base_url و api_key عوض می‌شود.
# پارامترهای extra_headers اختیاری‌اند ولی OpenRouter برای رتبه‌بندی/آمار پیشنهاد می‌کند.
llm = ChatOpenAI(
    model=CHAT_MODEL,
    api_key=OPENROUTER_API_KEY,
    base_url=OPENROUTER_BASE_URL,
    temperature=0.2,
    default_headers={
        "HTTP-Referer": "https://your-restaurant-app.example",  # اختیاری، آدرس سایت خودتان
        "X-Title": "Restaurant AI Backend",
    },
)
llm_with_tools = llm.bind_tools(TOOLS)

SYSTEM_PROMPT = """شما دستیار سفارش‌گیری رستوران هستید. دقیق و کوتاه پاسخ بده.

قوانین مهم:
- قبل از add_to_cart، همیشه با search_menu شناسه دقیق غذا را پیدا کن.
- برای دیدن سبد از view_cart استفاده کن؛ هرگز محتوای سبد را حدس نزن.
- فقط وقتی کاربر صریحاً گفت «ثبت کن»/«نهایی کن»، request_checkout را صدا بزن.
- برای درخواست لغو، اول با check_order_status وضعیت را ببین، بعد cancel_order را صدا بزن
  و پیام دقیق آن را عیناً به کاربر برگردان (خصوصاً وقتی cooking/completed است).

کاربر فعلی: user_id={user_id}، نام={customer_name}، ایمیل={customer_email}

سبد خرید فعلی (زنده از دیتابیس):
{cart_snapshot}
"""


def agent_node(state: AgentState):
    cart = db.get_cart_items(state["user_id"])
    cart_text = "\n".join([f"- {c['meals']['title']} × {c['quantity']}" for c in cart]) or "خالی است."

    sys_msg = SystemMessage(content=SYSTEM_PROMPT.format(
        user_id=state["user_id"],
        customer_name=state["customer_name"],
        customer_email=state["customer_email"],
        cart_snapshot=cart_text,
    ))
    response = llm_with_tools.invoke([sys_msg] + state["messages"])
    return {"messages": [response], "cart_snapshot": cart}
