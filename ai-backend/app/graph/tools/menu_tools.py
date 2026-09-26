from typing import Optional
from langchain_core.tools import tool
from app import db


@tool
def search_menu(category: Optional[str] = None, search_term: Optional[str] = None) -> str:
    """Search the restaurant menu by category or by meal name (search_term)."""
    try:
        meals = db.search_meals(category=category, search_term=search_term)
    except Exception as e:
        return f"Couldn't reach the database to search the menu right now ({type(e).__name__}). Please try again in a moment."
    if not meals:
        return "No meals found matching that description."
    lines = [f"- id {m['id']}: {m['title']} | ${m['price']} | {m['summary']}" for m in meals]
    return "\n".join(lines)
