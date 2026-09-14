CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE body_completeness AS ENUM ('full','excerpt','unknown');
CREATE TYPE source_scope AS ENUM ('hackathon_event','open_platform','oauth_user','demo_fixture');
CREATE TYPE candidate_status AS ENUM ('discovered','judging','accepted','rejected','compiling','failed','converted');
CREATE TYPE risk_level AS ENUM ('low','medium','high');
CREATE TYPE capability_type AS ENUM ('inspect','mission','diagnose','practice','configure','compare');
CREATE TYPE run_status AS ENUM ('draft','validating','ready','published','unpublished');
CREATE TYPE session_status AS ENUM ('created','engaged','completed','abandoned');

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  scope source_scope NOT NULL,
  external_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  url TEXT,
  introduction TEXT,
  body TEXT,
  completeness body_completeness NOT NULL DEFAULT 'unknown',
  labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  artwork TEXT,
  likes INTEGER,
  comments INTEGER,
  content_hash TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, external_id)
);

CREATE TABLE source_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  block_index INTEGER NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  text TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  UNIQUE(source_id, block_index)
);

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL UNIQUE REFERENCES sources(id),
  status candidate_status NOT NULL DEFAULT 'discovered',
  judge_result JSONB,
  run_score NUMERIC(5,2),
  risk risk_level,
  confidence NUMERIC(5,4),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE run_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL UNIQUE REFERENCES sources(id),
  candidate_id UUID REFERENCES candidates(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  capability capability_type NOT NULL,
  category TEXT,
  status run_status NOT NULL DEFAULT 'draft',
  active_version_id UUID,
  needs_recompile BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE run_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES run_apps(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  source_content_hash TEXT NOT NULL,
  schema_version TEXT NOT NULL DEFAULT '1.2',
  schema_json JSONB NOT NULL,
  compiler_model TEXT,
  judge_prompt_version TEXT,
  planner_prompt_version TEXT,
  compiler_prompt_version TEXT,
  validator_prompt_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_id, version)
);

ALTER TABLE run_apps
  ADD CONSTRAINT fk_active_version
  FOREIGN KEY (active_version_id) REFERENCES run_versions(id);

CREATE TABLE run_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES run_apps(id),
  run_version_id UUID NOT NULL REFERENCES run_versions(id),
  user_id UUID,
  anonymous_id TEXT,
  status session_status NOT NULL DEFAULT 'created',
  started_counted BOOLEAN NOT NULL DEFAULT false,
  completed_counted BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  engaged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

CREATE TABLE run_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES run_sessions(id) ON DELETE CASCADE,
  component_id TEXT NOT NULL,
  value JSONB,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, component_id)
);

CREATE TABLE run_result_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES run_sessions(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES run_apps(id),
  artifact_type TEXT NOT NULL,
  artifact_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  run_id UUID,
  session_id UUID,
  user_id UUID,
  anonymous_id TEXT,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sources_provider_complete ON sources(provider, completeness);
CREATE INDEX idx_blocks_source_index ON source_blocks(source_id, block_index);
CREATE INDEX idx_candidates_status_score ON candidates(status, run_score DESC);
CREATE INDEX idx_runs_status_published ON run_apps(status, published_at DESC);
CREATE INDEX idx_sessions_run_status ON run_sessions(run_id, status);
CREATE INDEX idx_sessions_user_updated ON run_sessions(user_id, updated_at DESC);
CREATE INDEX idx_progress_session ON run_progress(session_id);
