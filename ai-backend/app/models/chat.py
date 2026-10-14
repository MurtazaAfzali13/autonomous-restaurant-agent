from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """
    عمداً user_id / customer_name / customer_email اینجا نیست: هویت فقط از JWT تاییدشده می‌آید.
    اگر کلاینتی این فیلدها را بفرستد، نادیده گرفته می‌شوند.
    """
    message: str = Field(min_length=1, max_length=1000)
    resume: bool = False  # True یعنی این پیام پاسخ به یک سوال HITL (تایید سبد/رزرو) است


class ChatMessageResponse(BaseModel):
    type: str = "message"
    content: str
    remaining: int | None = None  # پیام‌های باقی‌مانده‌ی امروز


class ChatInterruptResponse(BaseModel):
    type: str = "interrupt"
    data: dict
    remaining: int | None = None
