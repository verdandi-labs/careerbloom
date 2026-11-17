CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    feature TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at);
