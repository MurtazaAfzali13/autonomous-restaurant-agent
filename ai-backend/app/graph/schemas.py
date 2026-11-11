from pydantic import BaseModel, Field


class ConfirmationIntent(BaseModel):
    confirmed: bool = Field(description="Checks if the user approved the final order confirmation.")
