from app.graph.tools.menu_tools import search_menu
from app.graph.tools.cart_tools import add_to_cart, remove_from_cart, view_cart
from app.graph.tools.order_tools import request_checkout, check_order_status, cancel_order
from app.graph.tools.room_tools import (
    search_available_rooms,
    get_room_details,
    request_room_booking,
    check_reservation_status,
    cancel_reservation,
    list_my_reservations,
)

TOOLS = [
    search_menu,
    add_to_cart,
    remove_from_cart,
    view_cart,
    request_checkout,
    check_order_status,
    cancel_order,
    search_available_rooms,
    get_room_details,
    request_room_booking,
    check_reservation_status,
    cancel_reservation,
    list_my_reservations,
]

__all__ = [
    "TOOLS",
    "search_menu",
    "add_to_cart",
    "remove_from_cart",
    "view_cart",
    "request_checkout",
    "check_order_status",
    "cancel_order",
    "search_available_rooms",
    "get_room_details",
    "request_room_booking",
    "check_reservation_status",
    "cancel_reservation",
    "list_my_reservations",
]
