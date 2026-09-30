# Chat Prompt Architecture

## Rule
Every chat feature must build its system prompt starting from `BLOOM_SYSTEM_PROMPT`.
Never define a standalone persona or security block — those live in `bloom.md` and `safety.md`.

## Adding a new chat feature — checklist
1. Create `backend/prompts/my_feature.md` and `docs/prompts/my_feature.md` (source of truth copy)
2. Add `load("my_feature")` to `backend/prompts/__init__.py` if needed
3. Build your system prompt constant in `backend/chat/service.py`:
```python
   MY_FEATURE_SYSTEM_PROMPT = (
       BLOOM_SYSTEM_PROMPT
       + "\n\n"
       + load("my_feature")
   )
```
4. Add a column to the table below
5. Never put persona, tone, or security rules in `my_feature.md` — those come from `BLOOM_SYSTEM_PROMPT`

## What goes where
- `bloom.md` — Bloom's persona, tone, and behavioral rules
- `safety.md` — security and prompt injection rules
- `my_feature.md` — feature-specific instructions only. No persona, no security.

## Composition pattern
```python
MY_FEATURE_SYSTEM_PROMPT = (
    BLOOM_SYSTEM_PROMPT        # bloom.md + safety.md + CHAT_APPLY_RULE
    + "\n\n"
    + load("my_feature")       # feature-specific instructions only
)
```

## Current prompts
| Feature | Prompt file | System prompt constant |
|---|---|---|
| CV chat | `cv.md` | `BLOOM_SYSTEM_PROMPT` + `cv.md` |
| Cover letter | `cover_letter.md` | `COVER_LETTER_SYSTEM_PROMPT` |
| Career direction | `career_direction.md` | `BLOOM_SYSTEM_PROMPT` + `career_direction.md` |
