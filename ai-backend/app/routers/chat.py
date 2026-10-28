import asyncio
import logging
import weakref

from fastapi import APIRouter, Depends, HTTPException, Request
from langgraph.types import Command

from app import db
from app.auth import CurrentUser, get_current_user
from app.config import GRAPH_RECURSION_LIMIT, MAX_MESSAGES_PER_DAY, MAX_STORED_TURNS
from app.graph.cards import collect_turn_cards
from app.graph.history import build_history, prune_state
from app.models.chat import ChatRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

# قفل به‌ازای هر کاربر (فقط داخل یک پروسه؛ با چند worker باید checkpointer را Postgres کنید).
_locks: "weakref.WeakValueDictionary[str, asyncio.Lock]" = weakref.WeakValueDictionary()


def _thread_lock(thread_id: str) -> asyncio.Lock:
    lock = _locks.get(thread_id)
    if lock is None:
        lock = asyncio.Lock()
        _locks[thread_id] = lock
    return lock


def _pending_interrupt(snapshot):
    for task in snapshot.tasks:
        if task.interrupts:
            return task.interrupts[0].value
    return None


@router.post("")
async def chat(req: ChatRequest, request: Request, user: CurrentUser = Depends(get_current_user)):
    graph = request.app.state.graph
    # thread_id از هویت تاییدشده ساخته می‌شود؛ کلاینت نمی‌تواند thread دیگری را بخواند یا با thread جدید سقف را دور بزند.
    thread_id = str(user.id)
    config = {
        "configurable": {"thread_id": thread_id},
        "recursion_limit": GRAPH_RECURSION_LIMIT,
    }
    remaining: int | None = None

    async with _thread_lock(thread_id):
        try:
            snapshot = await asyncio.to_thread(graph.get_state, config)
            pending = _pending_interrupt(snapshot)

            if req.resume:
                if pending is None:
                    raise HTTPException(status_code=409, detail="هیچ تاییدیه‌ی در انتظاری وجود ندارد.")
                # resume فقط نود confirm را اجرا می‌کند (بدون LLM)، پس از سهمیه کم نمی‌شود.
                result = await asyncio.to_thread(graph.invoke, Command(resume=req.message), config)
            else:
                if pending is not None:
                    return {"type": "interrupt", "data": pending, "cards": []}

                used = await asyncio.to_thread(db.consume_daily_message, user.id)
                if used == -1:
                    raise HTTPException(
                        status_code=429,
                        detail=f"سقف {MAX_MESSAGES_PER_DAY} پیام امروز شما تمام شده. فردا دوباره می‌توانید گفتگو کنید.",
                    )
                remaining = MAX_MESSAGES_PER_DAY - used

                result = await asyncio.to_thread(
                    graph.invoke,
                    {
                        "messages": [{"role": "user", "content": req.message}],
                        "user_id": user.id,
                        "customer_name": user.name,
                        "customer_email": user.email,
                        "thread_id": thread_id,
                    },
                    config,
                )

            # گفتگوی ماندگار نباید بی‌نهایت بزرگ شود؛ نوبت‌های خیلی قدیمی از checkpointer پاک می‌شوند.
            if "__interrupt__" not in result:
                try:
                    await asyncio.to_thread(prune_state, graph, config, MAX_STORED_TURNS)
                except Exception:
                    logger.warning("prune_state failed for user %s", user.id, exc_info=True)
        except HTTPException:
            raise
        except Exception:
            # عمداً refund نداریم: وگرنه با ساختن خطای عمدی (مثلاً recursion limit) می‌شد سقف را دور زد.
            logger.exception("chat failed for user %s", user.id)
            raise HTTPException(status_code=503, detail="الان نمی‌توانم پاسخ بدهم. لطفاً چند لحظه بعد دوباره تلاش کنید.")

    # کارت‌های UI (عکس غذا و ...) فقط برای پیام جدید؛ resume فقط تایید yes/no است.
    cards = [] if req.resume else collect_turn_cards(result.get("messages", []))
    logger.info("chat reply user=%s resume=%s cards=%d", user.id, req.resume, len(cards))

    if "__interrupt__" in result:
        return {"type": "interrupt", "data": result["__interrupt__"][0].value, "remaining": remaining, "cards": cards}

    return {"type": "message", "content": result["messages"][-1].content, "remaining": remaining, "cards": cards}


@router.get("/history")
async def get_history(request: Request, user: CurrentUser = Depends(get_current_user)):
    """گفتگوی ذخیره‌شده‌ی کاربر (برای ادامه‌ی گفتگو بعد از بستن تب یا ری‌استارت سرور) + تاییدیه‌ی در انتظار."""
    graph = request.app.state.graph
    config = {"configurable": {"thread_id": str(user.id)}}
    try:
        snapshot = await asyncio.to_thread(graph.get_state, config)
        used = await asyncio.to_thread(db.get_daily_count, user.id)
    except Exception:
        logger.exception("history failed for user %s", user.id)
        raise HTTPException(status_code=503, detail="Couldn't load the conversation right now.")

    pending = _pending_interrupt(snapshot)
    messages = (snapshot.values or {}).get("messages", [])
    return {
        "messages": build_history(messages, pending),
        "pending": pending,
        "remaining": max(MAX_MESSAGES_PER_DAY - used, 0),
    }


@router.delete("/history")
async def clear_history(request: Request, user: CurrentUser = Depends(get_current_user)):
    """
    «گفتگوی جدید»: فقط حافظه‌ی چت (checkpointer) پاک می‌شود.
    سبد، سفارش‌ها، رزروها و سهمیه‌ی روزانه‌ی پیام (جدول daily_usage) دست‌نخورده می‌مانند،
    پس این مسیر راهی برای دور زدن سقف ۱۰ پیام نیست.
    """
    thread_id = str(user.id)
    delete_thread = getattr(request.app.state.graph.checkpointer, "delete_thread", None)
    if delete_thread is None:
        raise HTTPException(status_code=501, detail="Upgrade langgraph-checkpoint-sqlite to enable clearing.")
    async with _thread_lock(thread_id):  # صبر می‌کند تا درخواست در حال اجرا تمام شود
        await asyncio.to_thread(delete_thread, thread_id)
    return {"status": "ok"}

# عمداً endpoint ی برای ریست سقف پیام وجود ندارد.
