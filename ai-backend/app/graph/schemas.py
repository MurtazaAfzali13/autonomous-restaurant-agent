from pydantic import BaseModel, Field


class ConfirmationIntent(BaseModel):
    confirmed: bool = Field(description="آیا کاربر ثبت نهایی سفارش را تایید کرد؟")
