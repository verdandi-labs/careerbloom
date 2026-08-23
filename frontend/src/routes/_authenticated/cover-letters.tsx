import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { api, errorMessage } from "@/lib/api";
import { LANGUAGES } from "@/lib/languages";
import {
  Download,
  FileText,
  Languages,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cover-letters")({
  head: () => ({ meta: [{ title: "Cover Letters · careerBloom" }] }),
  component: CoverLettersPage,
});

type Letter = {
  letter_id: string;
  name: string | null;
  language: string;
  text: string;
  created_at: string;
};

const languageLabel = (code: string) =>
  LANGUAGES.find((l) => l.code === code)?.label ?? code;

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CoverLettersPage() {
  const qc = useQueryClient();
  const { data: letters, isPending } = useQuery({
    queryKey: ["cover-letters"],
    queryFn: () => api<Letter[]>("/cover-letters"),
  });

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState("");

  async function generate() {
    if (!jobTitle.trim() || !company.trim()) {
      setErr("A job title and company help us start.");
      return;
    }
    setBusy(true);
    setErr("");
    setActionErr("");
    try {
      const name = `${jobTitle.trim()} at ${company.trim()}`;
      await api("/cover-letters/generate", {
        method: "POST",
        json: {
          job_title: jobTitle,
          company,
          job_description: jobDesc || null,
          language,
          name,
        },
      });
      await qc.invalidateQueries({ queryKey: ["cover-letters"] });
    } catch (e) {
      setErr(
        errorMessage(e, "Cover letter generation failed, please try again"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteLetter(id: string) {
    setDeleting(id);
    setActionErr("");
    try {
      await api(`/cover-letters/${id}`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey: ["cover-letters"] });
    } catch (e) {
      setActionErr(
        errorMessage(e, "Couldn't delete cover letter, please try again"),
      );
    } finally {
      setDeleting(null);
    }
  }

  async function exportPdf(letter: Letter) {
    setExporting(letter.letter_id);
    setActionErr("");
    try {
      const blob = await fetch(
        `/api/v1/cover-letters/${letter.letter_id}/export/pdf`,
        { method: "POST", credentials: "include" },
      ).then((r) => r.blob());
      await downloadBlob(blob, `${letter.name ?? "cover-letter"}.pdf`);
    } catch (e) {
      setActionErr(errorMessage(e, "Export failed, please try again"));
    } finally {
      setExporting(null);
    }
  }

  const lang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

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
      </header>

      <section className="glass p-7 space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55">
            New cover letter
          </p>
          <h2 className="mt-2 font-display text-3xl">
            Let's get this letter shining
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs uppercase tracking-wider text-foreground/60">
            Job title
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white/85 px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-secondary"
              placeholder="e.g. Senior Product Designer"
            />
          </label>
          <label className="text-xs uppercase tracking-wider text-foreground/60">
            Company
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white/85 px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-secondary"
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
            className="mt-1 w-full resize-none rounded-2xl bg-white/85 p-4 text-base outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Paste the description here…"
          />
        </label>
        <div className="relative">
          <span className="flex w-fit items-center gap-1 text-xs uppercase tracking-wider text-foreground/60">
            Language
          </span>
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 text-sm text-foreground hover:bg-white"
          >
            <Languages className="h-3.5 w-3.5" /> {lang.label}
          </button>
          {langOpen && (
            <div className="glass-strong absolute left-0 top-full z-30 mt-2 grid w-44 gap-1 p-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangOpen(false);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-left text-sm hover:bg-white ${language === l.code ? "bg-white/70 text-foreground" : "text-foreground/80"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
            {busy ? "Bloom is writing…" : "Generate draft"}
          </button>
        </div>
      </section>

      <h2 className="mt-10 font-display text-2xl">Saved letters</h2>
      {actionErr && (
        <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {actionErr}
        </p>
      )}

      {isPending ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
        </div>
      ) : letters && letters.length > 0 ? (
        <section className="mt-4 grid grid-cols-1 gap-5">
          {letters.map((l) => (
            <article
              key={l.letter_id}
              className="glass flex flex-col gap-4 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl">
                      {l.name ?? "Cover letter"}
                    </h3>
                    <p className="text-xs text-foreground/60">
                      {languageLabel(l.language)} ·{" "}
                      {new Date(l.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => void exportPdf(l)}
                    disabled={exporting === l.letter_id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-2 text-xs hover:bg-white disabled:opacity-50"
                  >
                    {exporting === l.letter_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}{" "}
                    Export PDF
                  </button>
                  <button
                    onClick={() => void deleteLetter(l.letter_id)}
                    disabled={deleting === l.letter_id}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-foreground/60 hover:bg-white disabled:opacity-50"
                  >
                    {deleting === l.letter_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/75">
                {l.text}
              </p>
            </article>
          ))}
        </section>
      ) : (
        <div className="glass mt-4 p-10 text-center text-sm text-foreground/60">
          No letters yet. Let's write your first one — we'll handle the blank
          page.
        </div>
      )}
    </AppShell>
  );
}
