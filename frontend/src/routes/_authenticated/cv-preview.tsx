import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { api, errorMessage } from "@/lib/api";
import { CvDocument, type EditableField } from "@/components/CvDocument";
import {
  CV_TEMPLATES,
  type CVData,
  type CVTemplateId,
  DEFAULT_TEMPLATE,
} from "@/lib/cv-templates";
import { ArrowLeft, BookMarked, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv-preview")({
  head: () => ({ meta: [{ title: "Preview & Export · careerBloom" }] }),
  component: PreviewPage,
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

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

const pick = (row: CvRow, keys: string[]) =>
  keys.map((k) => str(row[k])).filter((v): v is string => v !== null);

const join = (row: CvRow, keys: string[]) => pick(row, keys).join(", ");

const range = (
  row: CvRow,
  mainKeys: string[],
  dateKeys: string[],
  commentKey: string,
) => {
  const main = pick(row, mainKeys).join("  ");
  const dates = pick(row, dateKeys).join("  ");
  const comment = str(row[commentKey]);
  return [main, dates, comment].filter(Boolean).join(", ");
};

const listText = (data: CvData, key: string): string => {
  const rows = data[key as keyof CvData];
  if (!Array.isArray(rows)) return "";
  return (rows as CvRow[])
    .map((r) => {
      switch (key) {
        case "contact_details":
          return join(r, ["detail"]);
        case "experience":
          return range(
            r,
            ["company", "city"],
            ["start_date", "end_date"],
            "comments",
          );
        case "skills":
          return join(r, ["skill", "comments"]);
        case "studies":
          return range(
            r,
            ["edu_center", "city"],
            ["start_date", "end_date"],
            "comments",
          );
        case "awards":
          return join(r, ["name", "date", "comments"]);
        case "publications":
          return join(r, ["name", "date", "comments"]);
        case "volunteering":
          return range(
            r,
            ["center", "city"],
            ["start_date", "end_date"],
            "comments",
          );
        case "projects":
          return join(r, ["name", "url", "comments"]);
        case "languages":
          return join(r, ["language", "level", "comments"]);
        default:
          return "";
      }
    })
    .join("\n\n");
};

function toDocxData(data: CvData): CVData {
  return {
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
  };
}

const LOCAL_STORAGE_KEY = "cv-preview-local-edits";

function loadLocalEdits(): Partial<CVData> | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalEdits(data: CVData) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function PreviewPage() {
  const navigate = useNavigate();
  const {
    data: cv,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cv"],
    queryFn: () => api<CvData>("/cv"),
    retry: 2,
    retryDelay: 500,
  });

  const [selectedTemplate, setSelectedTemplate] =
    useState<CVTemplateId>(DEFAULT_TEMPLATE);
  const [mergedData, setMergedData] = useState<CVData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [actionErr, setActionErr] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<{version_id: string; cv_name: string; created_at: string}[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const recalcScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const available = parent.clientWidth - 32;
    setScale(Math.min(1, available / 794));
  }, []);

  useEffect(() => {
    recalcScale();
    const ro = new ResizeObserver(recalcScale);
    if (containerRef.current?.parentElement) ro.observe(containerRef.current.parentElement);
    return () => ro.disconnect();
  }, [recalcScale]);

  useEffect(() => {
    if (!cv) return;
    const base = toDocxData(cv);
    setMergedData(base);
  }, [cv]);

  function handleChange(field: EditableField, value: string) {
    setMergedData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      saveLocalEdits(next);
      return next;
    });
  }

  function handleReset() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (cv) setMergedData(toDocxData(cv));
  }

  async function handleExport() {
    if (!mergedData) return;
    setExporting(true);
    setActionErr("");
    try {
      const res = await fetch("/api/v1/cv/export/docx", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: mergedData,
          template: selectedTemplate,
          language: "en",
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      await downloadBlob(await res.blob(), "careerbloom-cv.docx");
    } catch (e) {
      setActionErr(errorMessage(e, "CV export failed, please try again"));
    } finally {
      setExporting(false);
    }
  }

  async function fetchVersions() {
    setVersionsLoading(true);
    try {
      const v = await api<{version_id: string; cv_name: string; created_at: string}[]>("/cv/versions");
      setVersions(v);
    } catch {
      // silent
    } finally {
      setVersionsLoading(false);
    }
  }

  async function handleLoadVersion(version_id: string) {
    try {
      const data = await api<CvData>(`/cv/versions/${version_id}`);
      const base = toDocxData(data);
      setMergedData(base);
      saveLocalEdits(base);
      setVersionsOpen(false);
    } catch {
      // silent
    }
  }

  async function handleDeleteVersion(version_id: string) {
    try {
      await api(`/cv/versions/${version_id}`, { method: "DELETE" });
      setVersions((v) => v.filter((x) => x.version_id !== version_id));
    } catch {
      // silent
    }
  }

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/cv" })}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-foreground hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-display text-3xl">Preview & Export</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-white/60 p-1">
              {CV_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    selectedTemplate === t.id
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-white"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => void handleExport()}
              disabled={exporting || !mergedData}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs text-background disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Export DOCX
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
            >
              Reset to saved
            </button>
            <button
              onClick={() => { setVersionsOpen(true); void fetchVersions(); }}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
            >
              <BookMarked className="h-3 w-3" /> Load Saved CV
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Edits here are saved locally and won't affect your CareerBloom
          profile.
        </p>
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
        ) : isError ? (
          <div className="grid place-items-center py-20 gap-4">
            <p className="text-sm text-muted-foreground">
              Could not load your CV.
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm underline text-muted-foreground hover:text-foreground transition-colors"
            >
              Retry
            </button>
          </div>
        ) : mergedData ? (
          <div ref={containerRef} className="flex justify-center">
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
              <CvDocument
                data={mergedData}
                template={selectedTemplate}
                editable={false}
                onChange={handleChange}
              />
            </div>
          </div>
        ) : null}
      </section>

      {versionsOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setVersionsOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-96 bg-pink-50/95 backdrop-blur-md shadow-2xl flex flex-col p-6 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Load Saved CV</h2>
              <button onClick={() => setVersionsOpen(false)}>
                <X className="h-4 w-4 text-foreground/50 hover:text-foreground" />
              </button>
            </div>
            <p className="text-sm text-foreground/50">You can save up to 6 CV versions. {versions.length} / 6 saved.</p>
            {versionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-foreground/40 text-center py-8">No saved versions yet.</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto">
                {versions.map((v) => (
                  <div key={v.version_id} className="rounded-2xl bg-white/80 shadow-sm border border-pink-100 px-4 py-3 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-foreground">{v.cv_name}</p>
                    <p className="text-xs text-foreground/40">{new Date(v.created_at).toLocaleDateString()}</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => void handleLoadVersion(v.version_id)}
                        className="flex-1 rounded-full bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-80 transition"
                      >
                        Load
                      </button>
                      {deletingVersionId === v.version_id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground/60">Delete?</span>
                          <button
                            onClick={() => { void handleDeleteVersion(v.version_id); setDeletingVersionId(null); }}
                            className="text-xs font-medium text-rose-500 hover:text-rose-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingVersionId(null)}
                            className="text-xs text-foreground/40 hover:text-foreground"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingVersionId(v.version_id)}
                          className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs text-foreground/60 hover:border-rose-300 hover:text-rose-400 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
