from fastapi import APIRouter, HTTPException
from app import db

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/{order_id}")
def get_order(order_id: int):
    order = db.get_order_with_items(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="سفارشی با این شماره پیدا نشد.")
    return order


@router.get("")
def list_orders(email: str):
    return db.list_orders_by_email(email)


@router.post("/{order_id}/cancel")
def cancel_order(order_id: int):
    """
    مسیر مستقیم (بدون چت‌بات) برای دکمه‌ی «لغو سفارش» در فرانت — همان منطقی که
    ابزار cancel_order چت‌بات استفاده می‌کند، اینجا هم صدا زده می‌شود تا هر دو مسیر یکی باشند.
    """
    success, message = db.cancel_order(order_id)
    if not success:
        raise HTTPException(status_code=409, detail=message)
    return {"status": "cancelled", "message": message}
