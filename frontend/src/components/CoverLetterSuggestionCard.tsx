import { useState } from "react";
import { Check, Loader2, Pencil, Sparkles, ThumbsDown, X } from "lucide-react";

export type CoverLetterSuggestion = {
  type: "cover_letter";
  options: string[];
};

export function CoverLetterSuggestionCard({
  suggestion,
  onSave,
  onDislike,
  savedCount,
}: {
  suggestion: CoverLetterSuggestion;
  onSave: (text: string, name: string) => Promise<boolean>;
  onDislike: () => Promise<void>;
  savedCount: number;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editedText, setEditedText] = useState("");
  const [nameInputFor, setNameInputFor] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [err, setErr] = useState("");
  const [confirmEvictionFor, setConfirmEvictionFor] = useState<number | null>(
    null,
  );

  const pendingText =
    nameInputFor === null
      ? ""
      : editingIdx === nameInputFor
        ? editedText
        : suggestion.options[nameInputFor];

  function handleSaveClick(i: number) {
    if (savedCount >= 4) {
      setConfirmEvictionFor(i);
    } else {
      setNameInputFor(i);
    }
  }

  async function confirmSave() {
    if (nameInputFor === null) return;
    setErr("");
    setBusy("save");
    const text = pendingText.trim();
    if (!text) {
      setErr("The letter is empty");
      setBusy(null);
      return;
    }
    const ok = await onSave(text, name.trim());
    setBusy(null);
    if (ok) {
      setDone(true);
      setJustSaved(true);
      setNameInputFor(null);
      setEditingIdx(null);
    } else {
      setErr("Couldn't save the letter, please try again");
    }
  }

  async function dislike() {
    if (done) return;
    setErr("");
    setBusy("dislike");
    try {
      await onDislike();
      setDone(true);
      setNameInputFor(null);
      setEditingIdx(null);
    } catch {
      setErr("Something went wrong, please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={`space-y-3 rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)] transition ${done ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          <Sparkles className="h-3 w-3" /> Cover letter options
        </p>
        {done && (
          <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-accent">
            <Check className="h-3 w-3" /> Done
          </p>
        )}
      </div>

      <div className="grid gap-3">
        {suggestion.options.map((letter, i) => (
          <div
            key={i}
            className="space-y-2 rounded-2xl border border-white/60 bg-white/60 p-3"
          >
            {editingIdx === i ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={10}
                className="w-full resize-y rounded-2xl bg-white/85 px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-secondary"
              />
            ) : (
              <p className="max-h-[200px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 pr-1">
                {letter}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {editingIdx === i ? (
                <>
                  <button
                    onClick={() => {
                      setEditingIdx(null);
                      handleSaveClick(i);
                    }}
                    disabled={done || busy !== null}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
                  >
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button
                    onClick={() => setEditingIdx(null)}
                    disabled={done || busy !== null}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSaveClick(i)}
                    disabled={done || busy !== null}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
                  >
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingIdx(i);
                      setEditedText(letter);
                    }}
                    disabled={done || busy !== null}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {confirmEvictionFor !== null && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            You already have 4 saved letters. Saving this one will remove your
            oldest letter.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setConfirmEvictionFor(null);
                setNameInputFor(confirmEvictionFor);
              }}
              disabled={busy !== null}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
            >
              Continue
            </button>
            <button
              onClick={() => setConfirmEvictionFor(null)}
              disabled={busy !== null}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {nameInputFor !== null && (
        <div className="space-y-2 rounded-2xl bg-white/60 p-3">
          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            Name this letter <span className="italic">(optional)</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full rounded-2xl bg-white/85 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g. Product Designer at Figma"
          />
          {justSaved && (
            <p className="inline-flex items-center gap-1 text-xs text-accent">
              <Check className="h-3 w-3" /> Saved!
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={confirmSave}
              disabled={busy !== null}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
            >
              {busy === "save" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}{" "}
              Confirm
            </button>
            <button
              onClick={() => {
                setNameInputFor(null);
                setErr("");
              }}
              disabled={busy !== null}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-xs text-destructive">{err}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={dislike}
          disabled={done || busy !== null}
          className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
        >
          {busy === "dislike" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ThumbsDown className="h-3 w-3" />
          )}{" "}
          I don't like any
        </button>
      </div>
    </div>
  );
}
