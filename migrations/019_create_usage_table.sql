CREATE TABLE IF NOT EXISTS usage (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT usage_user_date_unique UNIQUE (user_id, date)
    );

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage (user_id, date);
