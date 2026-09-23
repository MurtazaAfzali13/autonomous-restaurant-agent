import os
from dotenv import load_dotenv

load_dotenv()

# --- Supabase ---
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"]

# --- LLM (از طریق OpenRouter) ---
OPENROUTER_API_KEY: str = os.environ["OPENROUTER_API_KEY"]
OPENROUTER_BASE_URL: str = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
# فرمت OpenRouter: "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", ...
CHAT_MODEL: str = os.environ.get("CHAT_MODEL", "openai/gpt-4o-mini")

# --- محدودیت گفتگو (روزانه، به‌ازای هر کاربر) ---
MAX_MESSAGES_PER_DAY: int = int(os.environ.get("MAX_MESSAGES_PER_DAY", 10))

# --- LangGraph checkpointer ---
CHECKPOINT_DB_PATH: str = os.environ.get("CHECKPOINT_DB_PATH", "chat_memory.db")

# --- CORS ---
FRONTEND_ORIGIN: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

# --- پشتیبانی انسانی برای مواردی که چت‌بات نمی‌تواند لغو کند ---
RESTAURANT_SUPPORT_PHONE: str = os.environ.get("RESTAURANT_SUPPORT_PHONE", "09123456789")
