-- Users auth refactor: multi-tenant users table, hashed magic links, server-side sessions.

ALTER TABLE users RENAME COLUMN id TO user_id;

ALTER TABLE users DROP COLUMN IF EXISTS database_url;
ALTER TABLE users DROP COLUMN IF EXISTS magic_token;
ALTER TABLE users DROP COLUMN IF EXISTS magic_token_expires;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

ALTER TABLE users ADD COLUMN encryption_key text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN auth_method text NOT NULL DEFAULT 'magic_link';
ALTER TABLE users ADD COLUMN provider_id text;
ALTER TABLE users ADD COLUMN email_hash text;
ALTER TABLE users ADD COLUMN onboarding boolean NOT NULL DEFAULT false;

UPDATE users SET email_hash = encode(hmac(lower(btrim(email)), 'legacy', 'sha256'), 'hex') WHERE email IS NOT NULL;

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_auth_method_check CHECK (auth_method IN ('google', 'github', 'magic_link'));
ALTER TABLE users ADD CONSTRAINT users_email_hash_key UNIQUE (email_hash);

CREATE TABLE magic_link_tokens (
    token_id    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash  text        NOT NULL,
    token_hash  text        NOT NULL,
    expires_at  timestamptz NOT NULL,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE sessions (
    session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(user_id),
    token_hash text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);

DROP TABLE IF EXISTS profiles;
