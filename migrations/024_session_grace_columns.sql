ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS previous_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sessions_previous_token_hash
  ON sessions (previous_token_hash)
  WHERE previous_token_hash IS NOT NULL;
