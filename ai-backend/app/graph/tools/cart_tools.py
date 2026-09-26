from langchain_core.tools import tool
from app import db


@tool
def add_to_cart(user_id: int, meal_id: int, quantity: int = 1) -> str:
    """
    Add a meal to the user's cart. Written directly to the cart_items table
    (not graph memory), so the frontend picks it up instantly via Supabase Realtime.
    """
    try:
        item = db.add_cart_item(user_id, meal_id, quantity)
        return f"Added {quantity} to the cart (row id: {item['id']})."
    except ValueError:
        return "No meal found with that id."
    except Exception as e:
        # هر ابزار باید همیشه یک متن برگرداند، هرگز exception پرتاب نکند — وگرنه پیام
        # 'tool_call' مدل بدون پاسخ می‌ماند و تاریخچه‌ی چت برای همیشه خراب می‌شود.
        return f"Couldn't reach the database to update the cart right now ({type(e).__name__}). Please try again in a moment."


@tool
def remove_from_cart(user_id: int, meal_id: int) -> str:
    """Remove an item from the user's cart."""
    try:
        db.remove_cart_item(user_id, meal_id)
        return "Item removed from the cart."
    except Exception as e:
        return f"Couldn't reach the database to update the cart right now ({type(e).__name__}). Please try again in a moment."


@tool
def view_cart(user_id: int) -> str:
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
