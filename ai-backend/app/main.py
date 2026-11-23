import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.checkpointer import postgres_checkpointer
from app.config import FRONTEND_ORIGIN
from app.graph.build import build_graph
from app.routers import chat, menu, orders

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- startup: all resources are created here, not at import time ----
    await asyncio.to_thread(db.init_client)
    try:
        # Supabase Postgres checkpointer (replaces the local SQLite file)
        with postgres_checkpointer() as checkpointer:
            app.state.graph = build_graph(checkpointer)
            logger.info("Startup complete: Supabase client + Postgres checkpointer + graph ready")
            yield
    finally:
        # ---- shutdown (the checkpointer's connection pool is closed by the with-block) ----
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
