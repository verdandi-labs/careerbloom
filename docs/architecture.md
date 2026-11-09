# Architecture — Decision Log

## Data privacy model

CV content is extracted entirely on-server using local libraries — no third-party extraction API. After local extraction, the raw text is returned to the frontend and shown in an editable textarea. The user can read it, correct extraction errors, and delete anything they don’t want processed. Nothing is written to the database until the user reviews the content. Only when the user clicks save does POST /cv/save fire, which parses the text into the 12 structured JSONB fields and writes the result to the database. The user is never asked to hand over data they haven't seen first.

### CV preview is local-first

The `/cv` preview screen never writes to the server as you edit. Every change — inline text edits, section order, structured field updates — goes only to component state and `localStorage` (`cv-preview-local-edits`, `cv-preview-structured-edits`, `cv-preview-section-order`). The TanStack Query `["cv"]` cache holding the server copy is never mutated by preview edits, and no Zustand store is involved. The UI states the boundary directly: "Edits here are saved locally and won't affect your CareerBloom profile". "Reset to saved" simply removes the local keys and recomputes from server data. The only server writes from this screen happen on explicit actions: "Save CV" creates a version via `POST /cv/versions`, and the separate `/cv-editor` route persists per-field via `POST /cv/edit`.

### Uploads never touch disk, and retention is capped

Uploaded CV files are read into request memory and parsed from a `BytesIO` buffer — no temp files are ever written. Once saved, retention is bounded: the 4 most recent uploads are kept (the oldest is hard-deleted when a 5th arrives, cascading its edits), field edits are capped at 5 per field, and saved versions at 6. Users can delete saved versions; the current CV disappears via upload rotation or account deletion (FK cascade).

### When CV content reaches the model

Reviewing the extracted text and preview edits never sends anything to the model. CV content only leaves the server on explicit user actions: parsing at save time (`POST /cv/save`), translation (`POST /cv/translate`), and AI chat or cover letter generation, where the server attaches the current CV to the prompt wrapped as untrusted data. In chat flows the frontend never sends CV text itself — the server loads it from the DB. The provider is a third-party LLM inference service, so this is the one point where CV data crosses our boundary; everything upstream of those three actions stays on-server and local.

## LangGraph as AI orchestration layer

The original backend had a single ai_client.py with two functions — chat_completion and stream_chat_completion — that iterated through a hardcoded MODELS list using raw httpx calls. All workflows called these functions directly, passing pre-assembled message dicts. Prompt assembly, injection hardening, and output sanitisation happened ad hoc at each call site with no enforced order. As new workflows were added the lack of structure meant each one handled security and fallback differently, and changing shared behaviour required auditing every call site.

Refactored to LangGraph in progress. Each workflow is a compiled `StateGraph` operating on a shared `CareerBloomState` TypedDict. Shared concerns — LLM call, output validation, application intent detection, fallback routing — are implemented once as nodes in `graph/nodes.py` and edges in `graph/edges.py`. Each workflow in `workflows/` composes its own graph from those shared primitives and exports one compiled graph.

Adding a workflow is two files. Changing shared behaviour is one function. Prompt injection hardening and output validation are nodes that run on every workflow by graph structure, not by convention.

## Models
### Groq primary, Cloudflare Workers AI fallback

CareerBloom is built for people navigating career transitions. Users share sensitive personal data: employment history, reasons for leaving jobs, salary expectations, uncertainty about their future, etc. Privacy is a core product value, and that extends to which models process user data.

Groq is primary for the MVP. It provides the lowest latency of any free inference provider, a stable model list, and a DPA — GDPR compliant. All workflows use Groq by default.

Cloudflare Workers AI is used as fallback and can be chosen for secure tasks, workflows that process raw CV text or sensitive personal context directly. Cloudflare enforces zero data retention at the infrastructure level: requests are processed at the edge and never logged, stored, or used for training. This is a technical constraint, not a policy the user has to trust.

The model selection on both providers prioritises privacy. Groq's default model is `qwen/qwen3.8-27b` — same model family as the Cloudflare list, keeping the privacy reasoning consistent across providers. Cloudflare's model list excludes Meta and OpenAI models despite their availability, since their data policies are not aligned.

Both providers expose an OpenAI-compatible endpoint, so `ChatOpenAI` from `langchain-openai` covers both clients with no additional dependencies.

### No persistent model preference

Users can select a model from the current available list, but the selection is not persisted to the database. Free model providers change their model lists frequently — a stored model ID can become invalid between sessions, creating a silent failure or a confusing error. The cascade handles unavailable models gracefully, but a stored preference pointing at a deleted model is a bug waiting to happen with no clean recovery path. Session-scoped selection only.

### Daily model health check

Without proactive detection, the first signal of a missing model is a user-facing error in production.

Two GitHub Actions workflows run on a daily cron (`0 9 * * *`), one per provider. Both are also `workflow_dispatch` triggerable for immediate verification after an incident.

**Groq:** calls `https://api.groq.com/openai/v1/models`, diffs against `AVAILABLE_MODELS` in `llm/groq.py`, opens a GitHub issue if any are missing.

**Cloudflare:** calls `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/models/search`, diffs against `AVAILABLE_MODELS` in `llm/cloudflare.py`, opens a GitHub issue if any are missing.

## Single shared state — `CareerBloomState`

All workflows operate on the same underlying data: who the user is, what their CV contains, what the conversation history is. A single `TypedDict` in `graph/state.py` is the only state schema in the project.

Workflow-specific fields (`job_description`, `company_name`, `application_intent`) are present in the shared schema with `None` defaults. A node that does not need a field ignores it. No workflow defines its own state. New fields are added to `CareerBloomState` only.

## `.stream()` for user-facing calls, `.invoke()` for internal calls

`.stream()` for any LLM call whose output goes directly to the user. Users see responses rendered token by token — waiting for the full response degrades the experience on longer outputs.

`.invoke()` for internal classification calls where a complete result is required before the graph can route to the next node, such as detecting application intent. Streaming a classification response and parsing it mid-stream adds complexity with no user-facing benefit.

## Service layer owns state assembly

Services are the only layer that touches both the DB and the graph. They read user data using session-derived `user_id`, assemble the initial `CareerBloomState`, invoke the compiled workflow graph, and stream the response to the router.

The graph layer is stateless — any workflow can be invoked with a manually constructed state without a DB connection. Routers validate the incoming request, call the service, return the response. No AI logic, no DB queries, no state assembly in either layer.

## Prompts as typed `.py` modules

Each `prompts/*.py` exports `SYSTEM_PROMPT: str` and `build_messages(state: CareerBloomState) -> list[BaseMessage]`. Prompts are code — they receive typed state and return typed messages. Inline strings in nodes or `.md` files cannot be type-checked, tested in isolation, or traced cleanly through the pipeline. No prompt content lives anywhere else.

