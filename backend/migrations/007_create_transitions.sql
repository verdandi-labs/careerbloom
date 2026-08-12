CREATE TABLE transitions (
    transition_id   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES users(user_id),
    transition      text        NOT NULL,
    created_at      timestamptz DEFAULT now()
);