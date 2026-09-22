from typing import Optional
from langchain_core.tools import tool
from app import db


@tool
def search_menu(category: Optional[str] = None, search_term: Optional[str] = None) -> str:
    """جستجو در منوی رستوران بر اساس دسته‌بندی (category) یا نام غذا (search_term)."""
    meals = db.search_meals(category=category, search_term=search_term)
    if not meals:
        return "غذایی با این مشخصات در منو پیدا نشد."
    lines = [f"- کد {m['id']}: {m['title']} | ${m['price']} | {m['summary']}" for m in meals]
    return "\n".join(lines)
