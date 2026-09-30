-- 016: Create cv_saved_versions table, drop cv_translate table

DROP TABLE IF EXISTS cv_translate;

CREATE TABLE cv_saved_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    cv_name TEXT NOT NULL,
    full_name TEXT,
    title TEXT,
    self_summary TEXT,
    contact_details JSONB,
    experience JSONB,
    skills JSONB,
    studies JSONB,
    awards JSONB,
    publications JSONB,
    volunteering JSONB,
    projects JSONB,
    languages JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cv_saved_versions_user ON cv_saved_versions (user_id);
