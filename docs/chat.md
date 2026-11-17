# Chat Prompt Architecture

## Rule
Every chat feature builds its system prompt from `GENERAL_TONE` and `SAFETY` in `prompts/base.py`.
Never define a standalone persona or security block — those live in `base.py`.

## Adding a new chat feature — checklist
1. Create `src/prompts/my_feature.py` exporting `SYSTEM_PROMPT`:
```python
from prompts.base import GENERAL_TONE, SAFETY

SYSTEM_PROMPT = (
    """
Feature-specific instructions only
"""
    + GENERAL_TONE
    + SAFETY
)
```
2. Import it in `src/workflows/my_feature.py` and pass it to the shared LLM node:
```python
from prompts.my_feature import SYSTEM_PROMPT

return await llm_call_node(state, db, selected_model, SYSTEM_PROMPT)
```
3. Add a column to the table below
4. Never put persona, tone, or security rules in `my_feature.py` — those come from `GENERAL_TONE` and `SAFETY`

## What goes where
- `prompts/base.py` — `GENERAL_TONE` (Bloom's persona, tone, and behavioral rules) and `SAFETY` (security and prompt injection rules)
- `prompts/my_feature.py` — feature-specific instructions only. No persona, no security.

## Composition pattern
```python
SYSTEM_PROMPT = (
    """
    feature-specific instructions only
    """
    + GENERAL_TONE    # persona, tone, behavioral rules
    + SAFETY          # security and injection hardening
)
```

Prompts are typed `.py` modules, not `.md` files. There is no `load()` and no
prompt markdown — see `docs/architecture.md` for why.

## Current prompts
| Feature | Prompt module | System prompt constant |
|---|---|---|
| CV chat | `prompts/cv_chat.py` | `SYSTEM_PROMPT` |
| Cover letter | `prompts/cover_letter.py` | `SYSTEM_PROMPT` |
| Career direction | `prompts/career_direction.py` | `SYSTEM_PROMPT` |
| Job compatibility | `prompts/job_compatibility.py` | `SYSTEM_PROMPT` |

Non-chat consumers of `base.py`: `cv/parse.py` and `cv/translate.py` append
`SAFETY` to their own prompts; `graph/nodes.py` sends `GENERAL_TONE` as a
separate system message ahead of the feature prompt.
