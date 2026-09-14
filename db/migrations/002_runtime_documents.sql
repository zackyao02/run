-- Minimal durable documents used by the P0 monolith.  They intentionally keep
-- the validated schema JSON intact instead of introducing a second ORM model.
-- Apply after 001_init.sql to the same PostgreSQL/Supabase database.

CREATE TABLE IF NOT EXISTS app_run_documents (
  source_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('hero', 'supporting')),
  run_json JSONB NOT NULL,
  source_json JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'published' CHECK (state IN ('ready', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_draft_documents (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'ready', 'published')),
  approved_role TEXT CHECK (approved_role IN ('hero', 'supporting')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_session_documents (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_run_usage (
  run_id TEXT PRIMARY KEY,
  started INTEGER NOT NULL DEFAULT 0 CHECK (started >= 0),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_rate_events (
  id BIGSERIAL PRIMARY KEY,
  scope TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_run_documents_state ON app_run_documents(state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_draft_documents_state ON app_draft_documents(state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_session_documents_run ON app_session_documents(run_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_rate_events_scope_time ON app_rate_events(scope, occurred_at DESC);
