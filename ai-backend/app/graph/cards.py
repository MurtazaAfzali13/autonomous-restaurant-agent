from langchain_core.messages import HumanMessage, ToolMessage


def collect_turn_cards(messages: list) -> list[dict]:
    """
   UI cards are extracted only from current-turn ToolMessages (after the last HumanMessage) using hidden artifacts.
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
