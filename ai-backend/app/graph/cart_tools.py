from typing import Annotated
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from app import db

UserId = Annotated[int, InjectedState("user_id")]

@tool(response_format="content_and_artifact")
def add_to_cart(user_id: UserId, meal_id: int, quantity: int = 1) -> tuple[str, dict | None]:
    """
    Add a meal to the user's cart. Written directly to the cart_items table
    (not graph memory), so the frontend picks it up instantly via Supabase Realtime.
    """
    try:
        item = db.add_cart_item(user_id, meal_id, quantity)
        content = f"Added {quantity} × {item['title']} to the cart ({item['quantity']} of it now in the cart)."
        card = {
            "type": "cart_item_added",
            "meal_id": meal_id,
            "title": item["title"],
            "image": item.get("image"),
            "price": item["price"],
            "quantity_added": quantity,
            "quantity_in_cart": item["quantity"],
        }
        return content, card
    except ValueError as e:
        if str(e) == "invalid_quantity":
            return "Quantity must be between 1 and 50.", None
        return "No meal found with that id.", None
    except Exception as e:
        return f"Couldn't reach the database to update the cart right now ({type(e).__name__}). Please try again in a moment.", None


@tool
def remove_from_cart(user_id: UserId, meal_id: int) -> str:
    """Remove an item from the user's cart."""
    try:
        db.remove_cart_item(user_id, meal_id)
        return "Item removed from the cart."
    except Exception as e:
        return f"Couldn't reach the database to update the cart right now ({type(e).__name__}). Please try again in a moment."


@tool
def view_cart(user_id: UserId) -> str:
    """Show the user's current cart exactly as it is in the database — never guessed."""
    try:
        items = db.get_cart_items(user_id)
    except Exception as e:
        return f"Couldn't read the cart from the database right now ({type(e).__name__}). Please try again in a moment."
    if not items:
        return "The cart is empty."
    total = sum(i["price"] * i["quantity"] for i in items)
    lines = [f"- {i['meals']['title']} × {i['quantity']} = ${i['price'] * i['quantity']}" for i in items]
    return "\n".join(lines) + f"\nTotal: ${total}"
