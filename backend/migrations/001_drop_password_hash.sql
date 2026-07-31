-- Migration: drop the unused password_hash column from users table
-- Run against the Neon database:
--   uv run python -m scripts.run_sql "ALTER TABLE users DROP COLUMN IF EXISTS password_hash;"
-- (or psql "$NEON_DATABASE_URL" -c "ALTER TABLE users DROP COLUMN IF EXISTS password_hash;")

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
