from langchain_core.messages import HumanMessage, ToolMessage


def collect_turn_cards(messages: list) -> list[dict]:
    """
    کارت‌های UI (مثلاً عکس غذای اضافه‌شده) را فقط از ToolMessage‌های «همین نوبت» جمع می‌کند،
    یعنی بعد از آخرین HumanMessage. ابزارها این داده را در ToolMessage.artifact می‌گذارند؛
    artifact هرگز به مدل فرستاده نمی‌شود.
    """
    start = 0
    for i in range(len(messages) - 1, -1, -1):
        if isinstance(messages[i], HumanMessage):
            start = i
            break
    cards: list[dict] = []
    for m in messages[start:]:
        art = getattr(m, "artifact", None) if isinstance(m, ToolMessage) else None
        if isinstance(art, dict) and art.get("type"):
            cards.append(art)
    return cards
