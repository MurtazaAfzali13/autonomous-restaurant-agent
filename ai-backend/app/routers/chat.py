from fastapi import APIRouter, HTTPException
from langgraph.types import Command
from app import db
from app.graph.build import compiled_graph
from app.models.chat import ChatRequest

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
def chat(req: ChatRequest):
    thread_id = str(req.user_id)

    convo = db.get_conversation_for_today(thread_id, req.user_id)
    if convo["status"] == "limited":
        raise HTTPException(
            status_code=429,
            detail="سقف ۱۰ پیام امروز شما تمام شده. فردا دوباره می‌توانید گفتگو کنید، یا گفتگوی جدید شروع کنید.",
        )
    db.register_user_message(thread_id, req.user_id)

    config = {"configurable": {"thread_id": thread_id}}

    if req.resume:
       result = compiled_graph.invoke(Command(resume=req.message), config=config)
    else:
        snapshot = compiled_graph.get_state(config)
        if snapshot.next:
            for task in snapshot.tasks:
                if task.interrupts:
                    return {"type": "interrupt", "data": task.interrupts[0].value}

        result = compiled_graph.invoke(
            {
                "messages": [{"role": "user", "content": req.message}],
                "user_id": req.user_id,
                "customer_name": req.customer_name,
                "customer_email": req.customer_email,
                "thread_id": thread_id,
            },
            config=config,
        )

    if "__interrupt__" in result:
        interrupt_payload = result["__interrupt__"][0].value
        return {"type": "interrupt", "data": interrupt_payload}

    last_message = result["messages"][-1]
    return {"type": "message", "content": last_message.content}


@router.post("/reset")
def reset_chat(thread_id: str):
    """برای دکمه‌ی «گفتگوی جدید» در فرانت، وقتی کاربر به سقف پیام رسیده."""
    db.reset_conversation(thread_id)
    return {"status": "ok"}
