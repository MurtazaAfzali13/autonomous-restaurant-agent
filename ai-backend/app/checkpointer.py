"""
LangGraph checkpointer backed by Supabase Postgres.

Why the sync PostgresSaver: every graph call in the routes (graph.invoke, graph.get_state,
prune_state, delete_thread) is synchronous and runs in asyncio.to_thread, so the sync saver
is the drop-in replacement for the old SqliteSaver. Nothing else in the graph code changes.

The app connects through the Supabase *transaction pooler* (port 6543), which is why:
  - prepare_threshold=None -> disables server-side prepared statements (the pooler does not
                            support them; note that 0 would mean "prepare immediately", not "off")
  - autocommit=True      -> required by PostgresSaver
  - row_factory=dict_row -> required by PostgresSaver
"""
from contextlib import contextmanager

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver

from app.config import DATABASE_URL, DB_POOL_MAX_SIZE


@contextmanager
def postgres_checkpointer():
    """Open a small connection pool and yield a PostgresSaver. Closes the pool on exit."""
    pool = ConnectionPool(
        conninfo=DATABASE_URL,
        min_size=1,
        max_size=DB_POOL_MAX_SIZE,  # keep small: every serverless instance has its own pool
        kwargs={
            "autocommit": True,
            "prepare_threshold": None,
            "row_factory": dict_row,
        },
        check=ConnectionPool.check_connection,  # drop stale connections before handing them out
        open=False,
    )
    pool.open(wait=True, timeout=30)
    try:
        # Tables are created once by scripts/setup_checkpointer.py, not on every startup.
        yield PostgresSaver(pool)
    finally:
        pool.close()
