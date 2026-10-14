import asyncio

from fastapi import APIRouter, Depends, HTTPException

from app import db
from app.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
async def list_orders(user: CurrentUser = Depends(get_current_user)):
    return await asyncio.to_thread(db.list_orders_for_user, user.id)


@router.get("/{order_id}")
async def get_order(order_id: int, user: CurrentUser = Depends(get_current_user)):
    order = await asyncio.to_thread(db.get_order_with_items, order_id, user.id)
    if not order:
        raise HTTPException(status_code=404, detail="سفارشی با این شماره پیدا نشد.")
    return order


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: int, user: CurrentUser = Depends(get_current_user)):
    """همان منطقی که ابزار چت‌بات استفاده می‌کند؛ فقط برای سفارش‌های خود کاربر."""
    success, message = await asyncio.to_thread(db.cancel_order, order_id, user.id)
    if not success:
        raise HTTPException(status_code=409, detail=message)
    return {"status": "cancelled", "message": message}
