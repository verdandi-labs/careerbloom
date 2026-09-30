# CV Editor — Developer Notes

## Architecture overview

CV data lives in Postgres across three tables (`backend/shared/models/cv.py`):

| Table | Holds |
|---|---|
| `cv_upload` | The parsed upload: extracted text + JSONB parsed fields |
| `cv_edit` | Per-field edits applied after the upload |
| `cv_saved_versions` | User-saved snapshots (full `CvData`) |

`GET /cv` returns the **current merged state**, computed in `CvRepository.get_current_cv` (`backend/cv/repository.py`):

1. Load the latest `cv_upload`.
2. Load all `cv_edit` rows with `edit_date > upload.created_at`.
3. For each of the 12 `CV_FIELDS`, take the last non-null value across upload + edits.

Because edits are per-field and last-write-wins, a chat PATCH and an editor save both land as new `cv_edit` rows (or overwrite one — see `MAX_EDITS_PER_FIELD = 5`: once a field has 5 edit rows, `create_edit` reuses the oldest row instead of inserting a sixth).

`CV_FIELDS` = 3 text fields (`full_name`, `title`, `self_summary`) + 9 list sections (`contact_details`, `experience`, `skills`, `studies`, `awards`, `publications`, `volunteering`, `projects`, `languages`). Every list row carries a `line_num` (int, unique within its array).

## Who reads `/cv`

All of these hit the same endpoint:

- **`/cv`** (`cv.tsx`) — the "My CV" page: preview + modal item editing + exports/versions
- **`/cv-editor`** (`cv-editor.tsx`) — the section editor: text fields, list rows with inline drafts
- **`cv-chat.$conversationId.tsx`** — only to decide the greeting ("I've read your CV" vs "Upload your CV anytime")
- **Backend chat** (`chat/router.py:send_message`) — the merged CV is injected into the model prompt as `<cv>` context, so suggestions are grounded in the current state

The first three share one TanStack Query cache entry: `queryKey: ["cv"]`, `queryFn: () => api("/cv")`.

## Three ways data changes

**1. Upload** — `POST /cv/upload` extracts text, the LLM parses it (`backend/prompts/cv_parse.md`) into `CvData`, validated through `RAW_MODELS` → `FIELD_MODELS` in `backend/cv/schemas.py`, stored on `cv_upload`.

**2. Editor pages** — both pages save via `POST /cv/edit` with the *entire field value* (a whole string for text fields, a whole array for list sections). Validation goes through `FIELD_MODELS[field]`, so unknown keys are dropped here — the model is a whitelist. Deletes send the filtered array, or `null` when the last row is removed (`deleteRow`, `cv-editor.tsx`).

**3. CV chat** — fine-grained `PATCH /cv/sections/{section}/rows/{line_num}` (see below), or `/cv/edit` for text fields.

## The chat → editor round trip

1. `POST /chat/conversations/{id}/messages` streams the reply; before streaming, `send_message` loads the merged CV as context.
2. The model returns a fenced JSON block. `parse_suggestion` (`backend/chat/service.py`) validates it into one of three shapes and strips it from the visible text:
   - `{"type":"suggestion", section, text}` — plain text field (`ChatSuggestion`, section must be in `TEXT_FIELDS`)
   - `{"type":"row_suggestion", section, line_num, fields}` — list row (`CvRowSuggestion`, `line_num: null` = new row)
   - `{"type":"cover_letter", text}` — cover letter flow
3. The parsed dict is persisted on `chat_messages.suggestion` and returned in `MessageResponse`.
4. Frontend `mapMessage` attaches it to the message; `CvSuggestionCard` renders editable inputs (`ROW_FIELD_LABELS` supplies the labels).
5. Save:
   - **row** → `PATCH /cv/sections/{section}/rows/{line_num}` (the card sends `-1` for a new row, `line_num ?? -1`), fields whitelisted by `PATCHABLE` in `backend/cv/router.py:patch_cv_row`
   - **text** → `POST /cv/edit`
6. The PATCH handler reads rows as dicts (`model_dump()`), merges `{ ...r, ...fields }`, and writes the whole array back through `create_edit`.

Note: `CvSuggestionCard` does not invalidate `["cv"]` — fresh data appears on the next mount/focus of the editor pages (React Query default staleness), not live in an already-open editor.

## `line_num` semantics

- Assigned server-side as `max(existing) + 1` when created
- **`-1` in a PATCH path** = "create new row" (path param is an `int`, so `null` can't be used there)
- **`null` in suggestion JSON** = "create new row" (the card converts with `line_num ?? -1`)
- Stable within an array; rows are addressed by `line_num`, never by index

## Export paths

- **DOCX** and **PDF** section text is composed on the frontend from the section's `text:` / `listText` entry in *both* `cv-editor.tsx` and `cv.tsx` (`join`/`range` helpers). The backend DOCX writer just splits that text on blank lines — so a field missing from those functions is missing from exports even if it's in the DB.
- **Translate** (`POST /cv/translate`) sends the full JSON and instructs the model to keep all keys and `line_num`s (`cv_translate.md`), then re-validates as `CvData`.

## Field invariant: row assembly on save

When a list-section draft is saved (`saveDraft` in `frontend/src/routes/_authenticated/cv-editor.tsx`), the edited row is assembled by merging the existing row with the draft values:

```ts
{ ...r, ...values, line_num: d.lineNum }
```

Keys that exist on the row but are absent from the editor's `fields` config are therefore **preserved** on save. This is intentional: it guards against silently dropping database fields that haven't been wired to the UI yet (experience `title` was the first case — it lives in the JSONB row but has to survive edits made through fields the config knows about).

(The `/cv` page's modal editor already worked this way: `{ ...item, ...editDraft }` at `cv.tsx:534`.)

## Consequence: empty inputs must seed `null`, not omit the key

Because undeclared keys fall through from the old row, the reverse also holds: if a field declared in `fields` is missing from `values`, **the old value wins and the user's clear has no effect**.

`saveDraft` satisfies this today by assigning every configured field unconditionally:

```ts
for (const f of d.section.fields) {
  const v = d.values[f.key]?.trim();
  values[f.key] = v || null;
}
```

Any refactor that instead builds `values` from non-empty inputs only (e.g. spreading `Object.entries(d.values).filter(...)`) breaks clearing: the user empties the input, the key is omitted, the spread falls back to `{ ...r }`, and the stale value persists.

## Checklist for adding a field to a list section

1. Add the key to the section's `fields` config (editor input appears automatically).
2. Keep the unconditional `values[f.key] = v || null` seeding — empty means `null`, never absent.
3. If the field is new in the backend too, align all of these in one pass:
   - `backend/prompts/cv_parse.md` (what the parser extracts)
   - the Pydantic raw model in `backend/cv/schemas.py` (what validation keeps — undeclared keys are silently dropped)
   - `PATCHABLE` in `backend/cv/router.py` (what the chat PATCH endpoint accepts)
   - `ROW_FIELD_LABELS` in `frontend/src/components/CvSuggestionCard.tsx` (chat card labels)
   - the section's `text:`/`listText` entry in both `cv-editor.tsx` and `cv.tsx` (export text)
   - `ExperienceItem` in `frontend/src/lib/cv-templates.ts` plus the templates (preview rendering)
