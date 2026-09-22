from pydantic import BaseModel


class ChatRequest(BaseModel):
    user_id: int
    customer_name: str
    customer_email: str
    message: str
    resume: bool = False  # True یعنی این پیام پاسخ به یک سوال HITL (تایید سبد) است


class ChatMessageResponse(BaseModel):
    type: str = "message"
    content: str


class ChatInterruptResponse(BaseModel):
    type: str = "interrupt"
    data: dict
