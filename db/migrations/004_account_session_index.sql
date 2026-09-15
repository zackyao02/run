-- Session ownership stays inside the JSON snapshot to avoid storing raw Zhihu
-- account identifiers. This expression index keeps the account history query
-- fast once PostgreSQL is enabled in production.
CREATE INDEX IF NOT EXISTS idx_app_session_documents_account_updated
  ON app_session_documents ((snapshot ->> 'accountKey'), updated_at DESC);
