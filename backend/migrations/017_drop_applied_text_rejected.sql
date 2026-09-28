ALTER TABLE chat_messages
  DROP COLUMN IF EXISTS applied_text,
  DROP COLUMN IF EXISTS rejected;
