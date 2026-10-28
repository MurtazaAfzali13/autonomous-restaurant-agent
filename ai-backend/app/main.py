import asyncio
import logging
import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.sqlite import SqliteSaver

from app import db
from app.config import FRONTEND_ORIGIN, CHECKPOINT_DB_PATH
from app.graph.build import build_graph
from app.routers import chat, menu, orders

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- startup: همه‌ی منابع اینجا ساخته می‌شوند، نه موقع import ----
    await asyncio.to_thread(db.init_client)

    conn = sqlite3.connect(CHECKPOINT_DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")  # خواندن/نوشتن هم‌زمان بهتر
    checkpointer = SqliteSaver(conn)
    app.state.graph = build_graph(checkpointer)
    logger.info("Startup complete: Supabase client + checkpointer + graph ready")

    try:
        yield
    finally:
        # ---- shutdown ----
        conn.close()
        db.close_client()
        logger.info("Shutdown complete")


app = FastAPI(title="Restaurant AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(menu.router)
app.include_router(orders.router)


@app.get("/health")
async def health():
    """Liveness: فقط می‌گوید پروسه زنده است."""
    return {"status": "ok"}


@app.get("/health/ready")
async def ready():
    """Readiness: وابستگی واقعی (Supabase) را هم چک می‌کند."""
    try:
        await asyncio.to_thread(db.ping)
    except Exception as e:
        logger.warning("Readiness check failed: %s", e)
        raise HTTPException(status_code=503, detail="database_unreachable")
    return {"status": "ready"}
