DROP INDEX chat_conversations_user_updated_idx;

ALTER TABLE chat_conversations DROP COLUMN updated_at;

ALTER TABLE chat_conversations ADD CONSTRAINT chat_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'cv_upload'::regclass
          AND con.contype = 'f'
          AND con.confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE cv_upload DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

ALTER TABLE cv_upload ADD CONSTRAINT cv_upload_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'cv_edit'::regclass
          AND con.contype = 'f'
          AND con.confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE cv_edit DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

ALTER TABLE cv_edit ADD CONSTRAINT cv_edit_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'cv_translate'::regclass
          AND con.contype = 'f'
          AND con.confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE cv_translate DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

ALTER TABLE cv_translate ADD CONSTRAINT cv_translate_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'sessions'::regclass
          AND con.contype = 'f'
          AND con.confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE sessions DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'byodb'::regclass
          AND con.contype = 'f'
          AND con.confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE byodb DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

ALTER TABLE byodb ADD CONSTRAINT byodb_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'cover_letters'::regclass
          AND con.contype = 'f'
          AND con.confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE cover_letters DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

ALTER TABLE cover_letters ADD CONSTRAINT cover_letters_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'transitions'::regclass
          AND con.contype = 'f'
          AND con.confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE transitions DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

ALTER TABLE transitions ADD CONSTRAINT transitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;