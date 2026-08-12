DROP TABLE IF EXISTS cv_content;
DROP TABLE IF EXISTS cv_edits;
DROP TABLE IF EXISTS cv_uploads;

CREATE TABLE cv_upload (
    upload_id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES users(user_id),
    full_name       text,
    title           text,
    self_summary    text,
    contact_details jsonb,
    experience      jsonb,
    skills          jsonb,
    studies         jsonb,
    awards          jsonb,
    publications    jsonb,
    volunteering    jsonb,
    projects        jsonb,
    languages       jsonb,
    created_at      timestamptz DEFAULT now()
);

CREATE TABLE cv_edit (
    edit_id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id       uuid        NOT NULL REFERENCES cv_upload(upload_id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES users(user_id),
    full_name       text,
    title           text,
    self_summary    text,
    contact_details jsonb,
    experience      jsonb,
    skills          jsonb,
    studies         jsonb,
    awards          jsonb,
    publications    jsonb,
    volunteering    jsonb,
    projects        jsonb,
    languages       jsonb,
    edit_date       timestamptz DEFAULT now()
);

CREATE TABLE cv_translate (
    translate_id    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES users(user_id),
    language        text        NOT NULL,
    full_name       text,
    title           text,
    self_summary    text,
    contact_details jsonb,
    experience      jsonb,
    skills          jsonb,
    studies         jsonb,
    awards          jsonb,
    publications    jsonb,
    volunteering    jsonb,
    projects        jsonb,
    languages       jsonb,
    created_at      timestamptz DEFAULT now()
);
