import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { api, errorMessage } from "@/lib/api";

export type CvSuggestion = {
  type: "suggestion";
  section: string;
  text: string;
};

export type CvRowSuggestion = {
  type: "row_suggestion";
  section: string;
  line_num: number | null;
  fields: Record<string, string>;
};

const SECTION_LABELS: Record<string, string> = {
  self_summary: "Summary",
  title: "Title",
  experience: "Experience",
  skills: "Skills",
  languages: "Languages",
  studies: "Studies",
  awards: "Awards",
  publications: "Publications",
  volunteering: "Volunteering",
  projects: "Projects",
};

const ROW_FIELD_LABELS: Record<string, Record<string, string>> = {
  experience: { comments: "Description" },
  skills: { skill: "Skill", comments: "Notes" },
  languages: { language: "Language", level: "Level" },
  studies: { comments: "Description" },
  awards: { comments: "Notes" },
  publications: { comments: "Notes" },
  volunteering: { comments: "Description" },
  projects: { comments: "Description" },
};

export function CvSuggestionCard({
  suggestion,
  onDislike,
}: {
  suggestion: CvSuggestion | CvRowSuggestion;
  onDislike: () => void;
}) {
  const isRow = suggestion.type === "row_suggestion";
  const s = suggestion as CvRowSuggestion;
  const p = suggestion as CvSuggestion;

  const [text, setText] = useState(isRow ? "" : p.text);
  const [fields, setFields] = useState<Record<string, string>>(
    isRow ? { ...s.fields } : {},
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const sectionLabel = SECTION_LABELS[suggestion.section] ?? suggestion.section;
  const fieldLabels = ROW_FIELD_LABELS[suggestion.section] ?? {};
  const isNew = isRow && s.line_num === null;

  async function save() {
    setSaving(true);
    setErr("");
    try {
      if (isRow) {
        await api(`/cv/sections/${s.section}/rows/${s.line_num ?? -1}`, {
          method: "PATCH",
          json: { fields },
        });
      } else {
        await api("/cv/edit", {
          method: "POST",
          json: { field: p.section, value: text.trim() || null },
        });
      }
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
        <Sparkles className="h-3 w-3" />
        {isNew
          ? `New ${sectionLabel} entry`
          : `Suggested change · ${sectionLabel}`}
      </p>

      {isRow ? (
        <div className="space-y-2">
          {Object.entries(fields).map(([key, val]) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-foreground/60">
                {fieldLabels[key] ?? key}
              </label>
              <textarea
                value={val}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [key]: e.target.value }))
                }
                disabled={saved}
                rows={key === "comments" ? 4 : 1}
                className="w-full resize-y rounded-2xl bg-white/85 px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
              />
            </div>
          ))}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={saved}
          rows={4}
          className="w-full resize-y rounded-2xl bg-white/85 px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
        />
      )}

      {err && <p className="text-xs text-destructive">{err}</p>}

      {saved ? (
        <p className="inline-flex items-center gap-1 text-xs text-accent">
          <Check className="h-3 w-3" />
          {isNew
            ? `${sectionLabel} entry added to your CV`
            : `${sectionLabel} updated in your CV`}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={save}
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
