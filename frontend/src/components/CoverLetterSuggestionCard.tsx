import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export type CoverLetterSuggestion = {
  type: "cover_letter";
  text: string;
};

type LogStatus = "idle" | "logging" | "logged" | "dismissed" | "error";

function autofillJobFields(texts: string[]): [string, string] {
  for (const text of [...texts].reverse()) {
    const match = text.match(/\bfor\s+(.+?)\s+at\s+(.+?)(?:[.,;:!?\n]|$)/i);
    if (match) return [match[1].trim(), match[2].trim()];
  }
  return ["", ""];
}

export function CoverLetterSuggestionCard({
  suggestion,
  onSave,
  onDislike,
  recentAssistantTexts,
}: {
  suggestion: CoverLetterSuggestion;
  onSave: (text: string, name: string) => Promise<boolean>;
  onDislike: () => void;
  recentAssistantTexts?: string[];
}) {
  const [text, setText] = useState(suggestion.text);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [logStatus, setLogStatus] = useState<LogStatus>("idle");
  const [logErr, setLogErr] = useState("");

  async function save() {
    if (!name.trim()) {
      setErr("Please add a name for this letter");
      return;
    }
    setSaving(true);
    setErr("");
    const ok = await onSave(text.trim(), name.trim());
    setSaving(false);
    if (ok) {
      setSaved(true);
      const [role, company] = autofillJobFields(recentAssistantTexts ?? []);
      setJobTitle(role);
      setCompanyName(company);
    } else {
      setErr("Couldn't save the letter, please try again");
    }
  }

  async function logApplication() {
    setLogStatus("logging");
    setLogErr("");
    try {
      await api<{ created: boolean }>("/applications", {
        method: "POST",
        json: {
          job_title: jobTitle.trim() || null,
          company_name: companyName.trim() || null,
        },
      });
      setLogStatus("logged");
    } catch {
      setLogStatus("error");
      setLogErr("Couldn't log the application, please try again");
    }
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
        <Sparkles className="h-3 w-3" /> Cover letter
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={saved}
        rows={10}
        className="w-full resize-y rounded-2xl bg-white/85 px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
      />
      {!saved && (
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this letter, e.g. Product Designer at Figma"
            className="w-full rounded-2xl bg-white/85 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
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
              Save
            </button>
            <button
              onClick={onDislike}
              disabled={saving}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
            >
              I don't like it
            </button>
          </div>
        </div>
      )}
      {saved && (
        <p className="inline-flex items-center gap-1 text-xs text-[#284934]">
          <Check className="h-3 w-3" /> Saved to your cover letters
        </p>
      )}
      {saved && logStatus !== "logged" && logStatus !== "dismissed" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Role"
              aria-label="Role"
              className="w-full rounded-2xl bg-white/85 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary sm:w-44"
            />
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company"
              aria-label="Company"
              className="w-full rounded-2xl bg-white/85 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary sm:w-44"
            />
          </div>
          {logStatus === "error" && (
            <p className="text-xs text-destructive">{logErr}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void logApplication()}
              disabled={logStatus === "logging"}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
            >
              {logStatus === "logging" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}{" "}
              Log application
            </button>
            <button
              onClick={() => setLogStatus("dismissed")}
              disabled={logStatus === "logging"}
              className="inline-flex min-h-9 items-center rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-40"
            >
              No thanks
            </button>
          </div>
        </div>
      )}
      {saved && logStatus === "logged" && (
        <p className="inline-flex items-center gap-1 text-xs text-[#284934]">
          <Check className="h-3 w-3" /> Saved to your applications.
        </p>
      )}
    </div>
  );
}
