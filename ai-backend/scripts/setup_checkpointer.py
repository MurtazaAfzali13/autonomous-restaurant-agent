"""
One-time setup: creates the LangGraph checkpoint tables in Supabase.

Run it locally, once, from the ai-backend folder:

    python -m scripts.setup_checkpointer

Set SETUP_DATABASE_URL in .env to the Supabase *Session pooler* or *Direct* connection string
(port 5432). The migrations are more reliable there than through the transaction pooler (6543).
If SETUP_DATABASE_URL is not set, DATABASE_URL is used.
"""
import os

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row
from langgraph.checkpoint.postgres import PostgresSaver

load_dotenv()

url = os.environ.get("SETUP_DATABASE_URL") or os.environ["DATABASE_URL"]

# prepare_threshold=None disables server-side prepared statements. (0 would mean "prepare every
# statement on first use", which breaks behind the Supabase poolers with "_pg3_0 already exists".)
# PostgresSaver also requires autocommit=True and dict_row.
with psycopg.connect(url, autocommit=True, prepare_threshold=None, row_factory=dict_row) as conn:
    PostgresSaver(conn).setup()

print("Checkpoint tables are ready (checkpoints, checkpoint_blobs, checkpoint_writes, checkpoint_migrations).")
