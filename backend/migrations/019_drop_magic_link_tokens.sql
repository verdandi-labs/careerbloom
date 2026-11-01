-- Magic link auth removed: drop the token table.
-- users.auth_method may still hold 'magic_link' for pre-existing rows; the
-- CHECK constraint from 003 is left in place so those rows stay valid.

DROP TABLE IF EXISTS magic_link_tokens;
