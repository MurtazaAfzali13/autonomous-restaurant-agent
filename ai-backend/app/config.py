import os
from dotenv import load_dotenv

load_dotenv()

# --- Supabase ---
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY: str = os.environ["SUPABASE_SERVICE_KEY"]

# --- LLM (OpenRouter) ---
OPENROUTER_API_KEY: str = os.environ["OPENROUTER_API_KEY"]
OPENROUTER_BASE_URL: str = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
CHAT_MODEL: str = os.environ.get("CHAT_MODEL", "openai/gpt-4o-mini")
LLM_TIMEOUT_SECONDS: float = float(os.environ.get("LLM_TIMEOUT_SECONDS", 30))
LLM_MAX_RETRIES: int = int(os.environ.get("LLM_MAX_RETRIES", 2))

# --- Context window ---
# تعداد «نوبت‌های کاربر» که به مدل فرستاده می‌شود (هر نوبت = پیام کاربر + تمام ابزارها و پاسخ‌های بعدش).
# برای تست 4؛ در پروداکشن واقعی بالا ببرید (مثلاً 8 تا 12).
MAX_CONTEXT_TURNS: int = int(os.environ.get("MAX_CONTEXT_TURNS", 4))
# سقف مراحل agent<->tools در یک درخواست (جلوگیری از حلقه‌ی بی‌پایان ابزار)
GRAPH_RECURSION_LIMIT: int = int(os.environ.get("GRAPH_RECURSION_LIMIT", 12))

# --- محدودیت گفتگو ---
MAX_MESSAGES_PER_DAY: int = int(os.environ.get("MAX_MESSAGES_PER_DAY", 10))

# --- Timezone: «امروز» برای سقف روزانه و قانون لغو رزرو ---
APP_TIMEZONE: str = os.environ.get("APP_TIMEZONE", "Asia/Kabul")
# fail-fast: اگر timezone روی این سیستم پیدا نشود همان موقع استارت خطای واضح می‌دهد، نه در اولین درخواست.
# روی ویندوز پایگاه‌داده‌ی timezone وجود ندارد؛ باید:  pip install tzdata
try:
    from zoneinfo import ZoneInfo as _ZoneInfo
    _ZoneInfo(APP_TIMEZONE)
except Exception as _e:
    raise RuntimeError(
        f"Time zone '{APP_TIMEZONE}' not found ({type(_e).__name__}). "
        "On Windows run: pip install tzdata  — or set APP_TIMEZONE to a valid IANA name."
    ) from _e

# --- LangGraph checkpointer ---
CHECKPOINT_DB_PATH: str = os.environ.get("CHECKPOINT_DB_PATH", "chat_memory.db")

# --- احراز هویت: توکن کوتاه‌عمر که Next.js (بعد از لاگین NextAuth) امضا می‌کند ---
# همین مقدار باید دقیقاً در .env فرانت (سمت سرور) هم به نام BACKEND_JWT_SECRET باشد.
BACKEND_JWT_SECRET: str = os.environ["BACKEND_JWT_SECRET"]
if len(BACKEND_JWT_SECRET) < 32:
    raise RuntimeError("BACKEND_JWT_SECRET must be at least 32 characters.")
JWT_ISSUER: str = os.environ.get("JWT_ISSUER", "restaurant-web")
JWT_AUDIENCE: str = os.environ.get("JWT_AUDIENCE", "restaurant-ai-backend")

# --- CORS ---
FRONTEND_ORIGIN: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

RESTAURANT_SUPPORT_PHONE: str = os.environ.get("RESTAURANT_SUPPORT_PHONE", "09123456789")
