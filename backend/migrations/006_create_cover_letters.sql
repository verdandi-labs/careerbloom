DROP TABLE IF EXISTS cover_letters;

CREATE TABLE cover_letters (
    letter_id   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES users(user_id),
    name        text,
    language    text        NOT NULL,
    text        text        NOT NULL,
    created_at  timestamptz DEFAULT now()
);