from langchain_core.messages import AIMessage, HumanMessage, RemoveMessage, ToolMessage


def turn_start_index(messages: list, keep_turns: int) -> int:
    """اندیس شروع آخرین `keep_turns` نوبت (همیشه روی یک HumanMessage)؛ 0 یعنی چیزی برای حذف نیست."""
    human_idx = [i for i, m in enumerate(messages) if isinstance(m, HumanMessage)]
    if len(human_idx) <= keep_turns:
        return 0
    return human_idx[-keep_turns]


def _text(m) -> str:
    c = m.content
    if isinstance(c, str):
        return c
    if isinstance(c, list):  # بلاک‌های محتوا
        return "".join(b.get("text", "") for b in c if isinstance(b, dict))
    return ""


def build_history(messages: list, pending: dict | None) -> list[dict]:
    """
    state گراف را به پیام‌های قابل‌نمایش برای UI تبدیل می‌کند:
    پیام کاربر، پاسخ‌های نهایی دستیار، و کارت‌ها (artifact ابزارها). پیام‌های داخلی
    (tool_call ها و ToolMessage ها) نمایش داده نمی‌شوند.
    """
    out: list[dict] = []
    cards: list[dict] = []
    for i, m in enumerate(messages):
        if isinstance(m, HumanMessage):
            cards = []
            out.append({"id": m.id or f"h{i}", "role": "user", "content": _text(m)})
        elif isinstance(m, ToolMessage):
            art = m.artifact
            if isinstance(art, dict) and art.get("type"):
                cards.append(art)
        elif isinstance(m, AIMessage):
            if m.tool_calls:
                continue
            text = _text(m)
            if text or cards:
                out.append({"id": m.id or f"a{i}", "role": "assistant", "content": text, "cards": cards})
                cards = []
    if isinstance(pending, dict) and pending.get("question"):
        out.append({"id": "pending-confirmation", "role": "assistant", "content": pending["question"], "cards": cards})
    return out


def prune_state(graph, config: dict, keep_turns: int, slack: int = 5) -> int:
    """
    state ذخیره‌شده را به `keep_turns` نوبت آخر محدود می‌کند تا فایل checkpointer بی‌نهایت بزرگ نشود.
    فقط وقتی اجرا می‌شود که گراف تمام شده باشد (نه وسط interrupt) و از `slack` نوبت بیشتر باشد.
    تعداد پیام‌های حذف‌شده را برمی‌گرداند.
    """
    snap = graph.get_state(config)
    if snap.next:  # گراف وسط کار/منتظر تایید است
        return 0
    messages = (snap.values or {}).get("messages", [])
    humans = sum(isinstance(m, HumanMessage) for m in messages)
    if humans <= keep_turns + slack:
        return 0
    idx = turn_start_index(messages, keep_turns)
    if idx <= 0:
        return 0
    graph.update_state(config, {"messages": [RemoveMessage(id=m.id) for m in messages[:idx]]})
    return idx
