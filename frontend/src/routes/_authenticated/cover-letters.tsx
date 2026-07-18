import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  Globe2,
  Languages,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cover-letters")({
  head: () => ({ meta: [{ title: "Cover Letters · careerBloom" }] }),
  component: CoverLettersPage,
});

type Lang = "en" | "es";
type Letter = {
  id: string;
  job_title: string;
  company: string;
  job_description: string | null;
  content_en: string;
  content_es: string;
  created_at: string;
};

function CoverLettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [active, setActive] = useState<Letter | null>(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const data = await api<Letter[]>("/cover-letters");
    setLetters(data ?? []);
  }

  if (composing) {
    return (
      <AppShell>
        <Composer
          onCancel={() => setComposing(false)}
          onCreated={(l) => {
            setLetters((ls) => [l, ...ls]);
            setComposing(false);
            setActive(l);
          }}
        />
      </AppShell>
    );
  }

  if (active) {
    return (
      <AppShell>
        <LetterDetail
          letter={active}
          onBack={() => {
            setActive(null);
            void load();
          }}
          onDelete={async () => {
            await api(`/cover-letters/${active.id}`, { method: "DELETE" });
            setLetters((ls) => ls.filter((l) => l.id !== active.id));
            setActive(null);
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] flex flex-wrap items-end justify-between gap-4 px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
            Your library
          </p>
          <h1 className="mt-2 font-display text-4xl">Cover Letters</h1>
          <p className="mt-2 max-w-md text-sm text-foreground/75">
            Each one a little love letter to a future role.
          </p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-background"
        >
          <Plus className="h-4 w-4" /> New cover letter
        </button>
      </header>

      {letters.length === 0 ? (
        <div className="glass p-10 text-center text-sm text-foreground/60">
          No letters yet. Let's write your first one \u2014 we'll handle the
          blank page.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {letters.map((l) => {
            const excerpt = (l.content_en || l.content_es || "").slice(0, 140);
            return (
              <button
                key={l.id}
                onClick={() => setActive(l)}
                className="glass group flex flex-col gap-4 p-6 text-left transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl">{l.job_title}</h2>
                      <p className="text-xs text-foreground/60">
                        {l.company} \u00b7{" "}
                        {new Date(l.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground/70">
                  {excerpt ? (
                    `\u201c${excerpt}\u2026\u201d`
                  ) : (
                    <span className="italic text-foreground/40">
                      Open to add the words.
                    </span>
                  )}
                </p>
              </button>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}

function Composer({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (l: Letter) => void;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
    if (!jobTitle.trim() || !company.trim()) {
      setErr("A job title and company help us start.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const letter = await api<Letter>("/cover-letters", {
        method: "POST",
        json: {
          job_title: jobTitle,
          company,
          job_description: jobDesc || null,
        },
      });
      const generated = await api<Letter>(
        `/cover-letters/${letter.id}/generate`,
        {
          method: "POST",
          json: { cv_text: "" },
        },
      );
      onCreated(generated);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    }
    setBusy(false);
  }

  return (
    <section className="glass p-7 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55">
            New cover letter
          </p>
          <h2 className="font-display text-3xl">
            Let's get this letter shining
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs"
        >
          <X className="h-3 w-3" /> Close
        </button>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-wider text-foreground/60">
          Job title
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white/85 px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g. Senior Product Designer"
          />
        </label>
        <label className="text-xs uppercase tracking-wider text-foreground/60">
          Company
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white/85 px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary"
            placeholder="e.g. Figma"
          />
        </label>
      </div>
      <label className="block text-xs uppercase tracking-wider text-foreground/60">
        Job description{" "}
        <span className="lowercase italic text-foreground/40">
          (optional, makes it stronger)
        </span>
        <textarea
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          rows={6}
          className="mt-1 w-full resize-none rounded-2xl bg-white/85 p-4 text-sm outline-none focus:ring-2 focus:ring-secondary"
          placeholder="Paste the description here\u2026"
        />
      </label>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex justify-end">
        <button
          onClick={generate}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-background disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}{" "}
          {busy ? "Bloom is writing\u2026" : "Generate draft"}
        </button>
      </div>
    </section>
  );
}

function LetterDetail({
  letter,
  onBack,
  onDelete,
}: {
  letter: Letter;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [content, setContent] = useState({
    en: letter.content_en,
    es: letter.content_es,
  });
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const current = content[lang];

  function startEdit() {
    setDraft(current);
    setEditing(true);
  }
  async function save() {
    setBusy(true);
    const next = { ...content, [lang]: draft };
    await api(`/cover-letters/${letter.id}`, {
      method: "PATCH",
      json: { content_en: next.en, content_es: next.es },
    });
    setContent(next);
    setEditing(false);
    setBusy(false);
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const blob = await fetch(
        `/api/v1/cover-letters/${letter.id}/export/pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            job_title: letter.job_title,
            company: letter.company,
            content: current,
          }),
        },
      ).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${letter.company}-${lang}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  }

  return (
    <section className="glass p-7 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/70 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55">
              {letter.company}
            </p>
            <h2 className="font-display text-3xl">{letter.job_title}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
            {(["en", "es"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${lang === l ? "bg-accent text-accent-foreground" : "text-foreground/70"}`}
              >
                <Globe2 className="h-3 w-3" /> {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-2 text-xs text-background disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}{" "}
            Export PDF
          </button>
          <button
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-foreground/60 hover:bg-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={18}
            className="w-full resize-none rounded-3xl bg-white/85 p-5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-secondary"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}{" "}
              Save
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-3xl bg-white/70 p-6 text-sm leading-relaxed whitespace-pre-wrap relative">
          {current || (
            <span className="italic text-foreground/40">Nothing here yet.</span>
          )}
          <button
            onClick={startEdit}
            className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>
      )}
    </section>
  );
}
