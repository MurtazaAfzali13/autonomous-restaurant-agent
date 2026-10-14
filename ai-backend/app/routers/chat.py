import asyncio
import logging
import weakref

from fastapi import APIRouter, Depends, HTTPException, Request
from langgraph.types import Command

from app import db
from app.auth import CurrentUser, get_current_user
from app.config import GRAPH_RECURSION_LIMIT, MAX_MESSAGES_PER_DAY
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
                    return {"type": "interrupt", "data": pending}

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
        except HTTPException:
            raise
        except Exception:
            # عمداً refund نداریم: وگرنه با ساختن خطای عمدی (مثلاً recursion limit) می‌شد سقف را دور زد.
            logger.exception("chat failed for user %s", user.id)
            raise HTTPException(status_code=503, detail="الان نمی‌توانم پاسخ بدهم. لطفاً چند لحظه بعد دوباره تلاش کنید.")

    if "__interrupt__" in result:
        return {"type": "interrupt", "data": result["__interrupt__"][0].value, "remaining": remaining}

    return {"type": "message", "content": result["messages"][-1].content, "remaining": remaining}


