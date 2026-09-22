from fastapi import APIRouter, HTTPException
from app import db

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("")
def list_menu(category: str | None = None, search_term: str | None = None):
    return db.search_meals(category=category, search_term=search_term)


@router.get("/{meal_id}")
def get_meal(meal_id: int):
    meal = db.get_meal(meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="غذایی با این شناسه پیدا نشد.")
    return meal
