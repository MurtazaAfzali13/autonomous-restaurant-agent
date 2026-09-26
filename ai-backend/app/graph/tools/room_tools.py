from typing import Annotated
from langchain_core.tools import tool, InjectedToolCallId
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from app import db


@tool
def search_available_rooms(check_in: str, check_out: str, guests: int = 1) -> str:
    """
    Search for hotel rooms available between two dates (YYYY-MM-DD format) for a
    given number of guests. Always call this before booking, to find the exact room id.
    """
    try:
        rooms = db.search_available_rooms(check_in, check_out, guests)
    except Exception as e:
        return f"Couldn't reach the database to check room availability right now ({type(e).__name__}). Please try again in a moment."
    if not rooms:
        return "No rooms are available for those dates and party size."
    lines = [
        f"- id {r['id']}: {r['name']} ({r['type']}) | ${r['price_per_night']}/night | sleeps {r['capacity']}"
        for r in rooms
    ]
    return "\n".join(lines)


@tool
def get_room_details(room_id: int) -> str:
    """Show full details for one room by its id."""
    try:
        room = db.get_room(room_id)
    except Exception as e:
        return f"Couldn't reach the database to look up that room right now ({type(e).__name__}). Please try again in a moment."
    if not room:
        return "No room found with that id."
    return (
        f"{room['name']} ({room['type']})\n"
        f"{room.get('summary') or ''}\n"
        f"Price: ${room['price_per_night']}/night | Sleeps: {room['capacity']} | "
        f"Beds: {room.get('beds', '-')} | View: {room.get('view') or '-'}"
    )


@tool
def request_room_booking(
    user_id: int,
    room_id: int,
    check_in: str,
    check_out: str,
    tool_call_id: Annotated[str, InjectedToolCallId],
    adults: int = 1,
    children: int = 0,
) -> Command:
    """
    Call this only when the user explicitly says to book/finalize this room.
    Like request_checkout, this does NOT book the room itself and does NOT pause
    the graph — it only records that a booking was requested. The actual yes/no
    pause (HITL) happens right after, in a dedicated graph node
    (confirm_room_booking_node), never inside this tool. That separation is what
    keeps the chat history from getting corrupted, even if the model calls
    another tool (e.g. a food-cart tool) in the same turn.
    """
    try:
        room = db.get_room(room_id)
    except Exception as e:
        return Command(update={
            "messages": [ToolMessage(
                f"Couldn't reach the database to look up that room right now ({type(e).__name__}). Please try again in a moment.",
                tool_call_id=tool_call_id,
            )],
        })

    if not room:
        return Command(update={
            "messages": [ToolMessage("No room found with that id.", tool_call_id=tool_call_id)],
        })

    from datetime import date as _date
    try:
        nights = (_date.fromisoformat(check_out) - _date.fromisoformat(check_in)).days
    except ValueError:
        return Command(update={
            "messages": [ToolMessage("Dates must be in YYYY-MM-DD format.", tool_call_id=tool_call_id)],
        })

    if nights < 1:
        return Command(update={
            "messages": [ToolMessage("Check-out must be after check-in.", tool_call_id=tool_call_id)],
        })

    total = nights * float(room["price_per_night"])

    return Command(update={
        "messages": [ToolMessage("Booking requested — waiting for the guest's confirmation.", tool_call_id=tool_call_id)],
        "pending_room_booking": {
            "room_id": room_id,
            "room_name": room["name"],
            "check_in": check_in,
            "check_out": check_out,
            "nights": nights,
            "total": total,
            "adults": adults,
            "children": children,
            "user_id": user_id,
        },
    })


@tool
def check_reservation_status(reservation_id: int) -> str:
    """Check the current status of a room reservation by its reservation number."""
    try:
        status = db.get_reservation_status(reservation_id)
    except Exception as e:
        return f"Couldn't reach the database to check that reservation right now ({type(e).__name__}). Please try again in a moment."
    if status is None:
        return "No reservation found with that number."
    labels = {
        "pending": "pending confirmation",
        "confirmed": "confirmed",
        "checked_in": "guest checked in",
        "completed": "stay completed",
        "cancelled": "cancelled",
        "no_show": "no-show",
    }
    return f"Reservation {reservation_id} status: {labels.get(status, status)}"


@tool
def cancel_reservation(reservation_id: int) -> str:
    """
    Request to cancel a room reservation. Only succeeds while the status is still
    pending or confirmed AND the check-in date hasn't arrived yet. Otherwise the
    guest is pointed to contact the hotel directly.
    """
    try:
        _, message = db.cancel_reservation(reservation_id)
        return message
    except Exception as e:
        return f"Couldn't reach the database to cancel that reservation right now ({type(e).__name__}). Please try again in a moment."


@tool
def list_my_reservations(user_id: int) -> str:
    """Show all of this user's room reservations — always read live from the database, never guessed."""
    try:
        rows = db.get_user_reservations(user_id)
    except Exception as e:
        return f"Couldn't reach the database to list reservations right now ({type(e).__name__}). Please try again in a moment."
    if not rows:
        return "You have no room reservations."
    lines = [
        f"- reservation {r['id']}: {r['rooms']['name']} | {r['check_in']} to {r['check_out']} | status: {r['status']}"
        for r in rows
    ]
    return "\n".join(lines)
