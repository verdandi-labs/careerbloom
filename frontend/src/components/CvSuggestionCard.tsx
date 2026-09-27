import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { api, errorMessage } from "@/lib/api";

export type CvSuggestion = {
  type: "suggestion";
  section: string;
  text: string;
};

export function CvSuggestionCard({
  suggestion,
  onDislike,
}: {
  suggestion: CvSuggestion;
  onDislike: () => void;
}) {
  const [text, setText] = useState(suggestion.text);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  async function saveToCV() {
    setSaving(true);
    setErr("");
    try {
      await api("/cv/edit", {
        method: "POST",
        json: { field: suggestion.section, value: text.trim() || null },
      });
      setSaved(true);
    } catch (e) {
      setErr(errorMessage(e, "Couldn't save to CV, please try again"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
        <Sparkles className="h-3 w-3" /> Suggested change · {suggestion.section}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={saved}
        rows={4}
        className="w-full resize-y rounded-2xl bg-white/85 px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
      {saved ? (
        <p className="inline-flex items-center gap-1 text-xs text-accent">
          <Check className="h-3 w-3" /> Saved to CV
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={saveToCV}
            disabled={saving}
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}{" "}
            Save to CV
          </button>
          <button
            onClick={onDislike}
            disabled={saving}
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
          >
            I don't like it
          </button>
        </div>
      )}
    </div>
  );
}
