CREATE TABLE byodb (
    user_id     uuid PRIMARY KEY REFERENCES users(user_id),
    connection  text NOT NULL,
    created_at  timestamptz DEFAULT now()
);
