-- Run once in the Supabase SQL Editor, AFTER scripts/setup_checkpointer.py.
-- The checkpoint tables hold full chat history. Supabase exposes the public schema through its
-- REST API, so without RLS anyone holding the anon key could read them.
-- With RLS on and no policies, only the backend can access them (the Postgres connection and the
-- service role bypass RLS).

ALTER TABLE public.checkpoints           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_blobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_writes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_migrations ENABLE ROW LEVEL SECURITY;
