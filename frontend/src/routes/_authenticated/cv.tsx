import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { api, errorMessage } from "@/lib/api";
import { DEFAULT_TEMPLATE } from "@/lib/cv-templates";
import { LANGUAGES } from "@/lib/languages";
import { Download, Languages, Loader2, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv")({
  head: () => ({ meta: [{ title: "CV Builder · careerBloom" }] }),
  component: CVPage,
});

type CvRow = {
  line_num: number;
  [key: string]: string | number | null | undefined;
};

type CvData = {
  full_name: string | null;
  title: string | null;
  self_summary: string | null;
  contact_details: CvRow[] | null;
  experience: CvRow[] | null;
  skills: CvRow[] | null;
  studies: CvRow[] | null;
  awards: CvRow[] | null;
  publications: CvRow[] | null;
  volunteering: CvRow[] | null;
  projects: CvRow[] | null;
  languages: CvRow[] | null;
};

const TRANSLATION_LANGUAGES = LANGUAGES;

const TEXT_SECTIONS = [
  { key: "full_name", label: "Full name" },
  { key: "title", label: "Title" },
  { key: "self_summary", label: "Summary" },
] as const;

type TextKey = (typeof TEXT_SECTIONS)[number]["key"];
type ListKey =
  | "contact_details"
  | "experience"
  | "skills"
  | "studies"
  | "awards"
  | "publications"
  | "volunteering"
  | "projects"
  | "languages";

type ListSection = {
  key: ListKey;
  label: string;
  fields: Array<{ key: string; label: string; textarea?: boolean }>;
  text: (row: CvRow) => string;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

const asStr = (v: unknown) => (typeof v === "string" ? v : "");

const pick = (row: CvRow, keys: string[]) =>
  keys.map((k) => str(row[k])).filter((v): v is string => v !== null);

const join = (row: CvRow, keys: string[]) => pick(row, keys).join(", ");

const range = (
  row: CvRow,
  mainKeys: string[],
  dateKeys: string[],
  commentKey: string,
) => {
  const main = pick(row, mainKeys).join(" \u2014 ");
  const dates = pick(row, dateKeys).join(" \u2013 ");
  const comment = str(row[commentKey]);
  return [main, dates, comment].filter(Boolean).join(", ");
};

const LIST_SECTIONS: ListSection[] = [
  {
    key: "contact_details",
    label: "Contact details",
    fields: [{ key: "detail", label: "Detail" }],
    text: (r) => join(r, ["detail"]),
  },
  {
    key: "experience",
    label: "Experience",
    fields: [
      { key: "company", label: "Company" },
      { key: "city", label: "City" },
      { key: "start_date", label: "Start" },
      { key: "end_date", label: "End" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) =>
      range(r, ["company", "city"], ["start_date", "end_date"], "comments"),
  },
  {
    key: "skills",
    label: "Skills",
    fields: [
      { key: "skill", label: "Skill" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) => join(r, ["skill", "comments"]),
  },
  {
    key: "studies",
    label: "Studies",
    fields: [
      { key: "edu_center", label: "Center" },
      { key: "city", label: "City" },
      { key: "start_date", label: "Start" },
      { key: "end_date", label: "End" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) =>
      range(r, ["edu_center", "city"], ["start_date", "end_date"], "comments"),
  },
  {
    key: "awards",
    label: "Awards",
    fields: [
      { key: "name", label: "Name" },
      { key: "date", label: "Date" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) => join(r, ["name", "date", "comments"]),
  },
  {
    key: "publications",
    label: "Publications",
    fields: [
      { key: "name", label: "Name" },
      { key: "date", label: "Date" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) => join(r, ["name", "date", "comments"]),
  },
  {
    key: "volunteering",
    label: "Volunteering",
    fields: [
      { key: "center", label: "Center" },
      { key: "city", label: "City" },
      { key: "start_date", label: "Start" },
      { key: "end_date", label: "End" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) =>
      range(r, ["center", "city"], ["start_date", "end_date"], "comments"),
  },
  {
    key: "projects",
    label: "Projects",
    fields: [
      { key: "name", label: "Name" },
      { key: "url", label: "URL" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) => join(r, ["name", "url", "comments"]),
  },
  {
    key: "languages",
    label: "Languages",
    fields: [
      { key: "language", label: "Language" },
      { key: "level", label: "Level" },
      { key: "comments", label: "Comments", textarea: true },
    ],
    text: (r) => join(r, ["language", "level", "comments"]),
  },
];

type Draft =
  | { kind: "text"; key: TextKey; value: string }
  | {
      kind: "list";
      section: ListSection;
      lineNum: number | null;
      values: Record<string, string>;
    }
  | null;

type TranslatedCv = { data: CvData; code: string; label: string };

const listText = (data: CvData, key: ListKey) =>
  (data[key] ?? [])
    .map((r) => LIST_SECTIONS.find((s) => s.key === key)!.text(r))
    .join("\n\n");

const toDocxData = (data: CvData): Record<string, string> => ({
  name: data.full_name ?? "",
  title: data.title ?? "",
  contact: listText(data, "contact_details"),
  summary: data.self_summary ?? "",
  experience: listText(data, "experience"),
  education: listText(data, "studies"),
  skills: listText(data, "skills"),
  languages: listText(data, "languages"),
  certifications: "",
  projects: listText(data, "projects"),
  volunteer: listText(data, "volunteering"),
  awards: listText(data, "awards"),
  publications: listText(data, "publications"),
  references: "",
  other: "",
});

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CVPage() {
  const qc = useQueryClient();
  const { data: cv, isPending } = useQuery({
    queryKey: ["cv"],
    queryFn: () => api<CvData>("/cv"),
  });
  const [draft, setDraft] = useState<Draft>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<TranslatedCv | null>(null);
  const [actionErr, setActionErr] = useState("");

  async function save(field: string, value: string | CvRow[] | null) {
    setSaving(true);
    setActionErr("");
    try {
      await api("/cv/edit", { method: "POST", json: { field, value } });
      await qc.invalidateQueries({ queryKey: ["cv"] });
    } catch (e) {
      setActionErr(errorMessage(e, "Couldn't save CV, please try again"));
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    const d = draft;
    if (!d) return;
    if (d.kind === "text") {
      await save(d.key, d.value.trim() || null);
    } else {
      const rows = cv?.[d.section.key] ?? [];
      const values: Record<string, string | null> = {};
      for (const f of d.section.fields) {
        const v = d.values[f.key]?.trim();
        values[f.key] = v || null;
      }
      const next =
        d.lineNum === null
          ? [
              ...rows,
              {
                ...values,
                line_num: rows.reduce((m, r) => Math.max(m, r.line_num), 0) + 1,
              },
            ]
          : rows.map((r) =>
              r.line_num === d.lineNum ? { ...values, line_num: d.lineNum } : r,
            );
      await save(d.section.key, next);
    }
    setDraft(null);
  }

  async function deleteRow(section: ListSection, lineNum: number) {
    const rows = (cv?.[section.key] ?? []).filter(
      (r) => r.line_num !== lineNum,
    );
    setDraft(null);
    await save(section.key, rows.length ? rows : null);
  }

  async function translateTo(code: string) {
    const lang = TRANSLATION_LANGUAGES.find((l) => l.code === code);
    setTranslateOpen(false);
    if (!lang) return;
    setTranslating(true);
    setActionErr("");
    try {
      const result = await api<CvData>("/cv/translate", {
        method: "POST",
        json: { language: lang.code },
      });
      setTranslated({ data: result, code: lang.code, label: lang.label });
    } catch (e) {
      setActionErr(
        errorMessage(
          e,
          "Translation failed, please try uploading a cleaner CV",
        ),
      );
    } finally {
      setTranslating(false);
    }
  }

  async function exportDocx(source: CvData, code?: string) {
    setExporting(true);
    setActionErr("");
    try {
      const res = await fetch("/api/v1/cv/export/docx", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: toDocxData(source),
          template: DEFAULT_TEMPLATE,
          language: code ?? "en",
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      await downloadBlob(
        await res.blob(),
        code ? `careerbloom-cv-${code}.docx` : "careerbloom-cv.docx",
      );
    } catch (e) {
      setActionErr(errorMessage(e, "CV export failed, please try again"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
              Living document
            </p>
            <h1 className="mt-2 font-display text-4xl">
              Your story, in your voice
            </h1>
            <p className="mt-2 max-w-xl text-sm text-foreground/75">
              Click any section to edit. Saves as you go.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setTranslateOpen((v) => !v)}
                disabled={translating || !cv}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white disabled:opacity-50"
              >
                {translating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Languages className="h-3 w-3" />
                )}{" "}
                Translate
              </button>
              {translateOpen && (
                <div className="glass-strong absolute right-0 top-full z-30 mt-2 grid w-44 gap-1 p-2">
                  {TRANSLATION_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => void translateTo(l.code)}
                      className="rounded-xl px-3 py-1.5 text-left text-sm text-foreground/80 hover:bg-white"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => cv && void exportDocx(cv)}
              disabled={exporting || !cv}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs text-background disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}{" "}
              Export DOCX
            </button>
          </div>
        </div>
      </header>

      {actionErr && (
        <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {actionErr}
        </p>
      )}

      <section className="rounded-3xl bg-neutral-100/60 p-4 md:p-8">
        {isPending ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
          </div>
        ) : (
          <div className="space-y-10">
            {TEXT_SECTIONS.map((s) => {
              const value = cv?.[s.key] ?? "";
              const editing = draft?.kind === "text" && draft.key === s.key;
              return (
                <section key={s.key}>
                  <h2 className="mb-2 text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                    {s.label}
                  </h2>
                  {editing ? (
                    <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                      {s.key === "self_summary" ? (
                        <textarea
                          autoFocus
                          rows={5}
                          value={draft.kind === "text" ? draft.value : ""}
                          onChange={(e) =>
                            setDraft({
                              kind: "text",
                              key: s.key,
                              value: e.target.value,
                            })
                          }
                          className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      ) : (
                        <input
                          autoFocus
                          value={draft.kind === "text" ? draft.value : ""}
                          onChange={(e) =>
                            setDraft({
                              kind: "text",
                              key: s.key,
                              value: e.target.value,
                            })
                          }
                          className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                        />
                      )}
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => setDraft(null)}
                          className="rounded-2xl bg-white/60 px-4 py-2 text-sm text-foreground/70 hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void saveDraft()}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
                        >
                          {saving && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setDraft({ kind: "text", key: s.key, value })
                      }
                      className={`w-full rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-left text-sm transition hover:bg-white ${value ? "text-foreground" : "text-foreground/40 italic"}`}
                    >
                      {value || "Click to add"}
                    </button>
                  )}
                </section>
              );
            })}

            {LIST_SECTIONS.map((s) => {
              const rows = cv?.[s.key] ?? [];
              const editing =
                draft?.kind === "list" && draft.section.key === s.key;
              return (
                <section key={s.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                      {s.label}
                    </h2>
                    <button
                      onClick={() =>
                        setDraft({
                          kind: "list",
                          section: s,
                          lineNum: null,
                          values: Object.fromEntries(
                            s.fields.map((f) => [f.key, ""]),
                          ),
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {rows.length === 0 && !editing && (
                      <p className="px-2 text-sm italic text-foreground/40">
                        Nothing here yet.
                      </p>
                    )}
                    {rows.map((row) => (
                      <div
                        key={row.line_num}
                        className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/60 transition hover:bg-white"
                      >
                        <button
                          onClick={() =>
                            setDraft({
                              kind: "list",
                              section: s,
                              lineNum: row.line_num,
                              values: Object.fromEntries(
                                s.fields.map((f) => [f.key, asStr(row[f.key])]),
                              ),
                            })
                          }
                          className="flex-1 px-4 py-3 text-left text-sm text-foreground"
                        >
                          {s.text(row) || "Empty entry"}
                        </button>
                        <button
                          onClick={() => void deleteRow(s, row.line_num)}
                          className="mr-2 grid h-8 w-8 place-items-center rounded-xl text-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {editing && (
                      <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
                        {s.fields.map((f) =>
                          f.textarea ? (
                            <label
                              key={f.key}
                              className="mt-3 block first:mt-0"
                            >
                              <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-foreground/60">
                                {f.label}
                              </span>
                              <textarea
                                rows={3}
                                value={
                                  draft.kind === "list"
                                    ? (draft.values[f.key] ?? "")
                                    : ""
                                }
                                onChange={(e) =>
                                  draft.kind === "list" &&
                                  setDraft({
                                    ...draft,
                                    values: {
                                      ...draft.values,
                                      [f.key]: e.target.value,
                                    },
                                  })
                                }
                                className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                              />
                            </label>
                          ) : (
                            <label
                              key={f.key}
                              className="mt-3 block first:mt-0"
                            >
                              <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-foreground/60">
                                {f.label}
                              </span>
                              <input
                                value={
                                  draft.kind === "list"
                                    ? (draft.values[f.key] ?? "")
                                    : ""
                                }
                                onChange={(e) =>
                                  draft.kind === "list" &&
                                  setDraft({
                                    ...draft,
                                    values: {
                                      ...draft.values,
                                      [f.key]: e.target.value,
                                    },
                                  })
                                }
                                className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                              />
                            </label>
                          ),
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            onClick={() => setDraft(null)}
                            className="rounded-2xl bg-white/60 px-4 py-2 text-sm text-foreground/70 hover:bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => void saveDraft()}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
                          >
                            {saving && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-center text-[11px] text-foreground/50">
          {saving ? "Saving\u2026" : ""}
        </p>
      </section>

      {translated && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-md">
          <div className="glass-strong relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-8">
            <button
              onClick={() => setTranslated(null)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/60 text-foreground hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-display text-3xl">
              Translated CV · {translated.label}
            </h2>
            <div className="mt-6 space-y-6">
              {TEXT_SECTIONS.map((s) => {
                const value = translated.data[s.key];
                if (!value) return null;
                return (
                  <section key={s.key}>
                    <h3 className="mb-1 text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                      {s.label}
                    </h3>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {value}
                    </p>
                  </section>
                );
              })}
              {LIST_SECTIONS.map((s) => {
                const rows = translated.data[s.key] ?? [];
                if (rows.length === 0) return null;
                return (
                  <section key={s.key}>
                    <h3 className="mb-1 text-[11px] uppercase tracking-[0.22em] text-foreground/60">
                      {s.label}
                    </h3>
                    <ul className="space-y-1">
                      {rows.map((r) => (
                        <li
                          key={r.line_num}
                          className="text-sm text-foreground"
                        >
                          {s.text(r)}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap justify-end gap-2">
              <button
                onClick={() =>
                  void exportDocx(translated.data, translated.code)
                }
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-2.5 text-sm text-background disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}{" "}
                Export DOCX
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
