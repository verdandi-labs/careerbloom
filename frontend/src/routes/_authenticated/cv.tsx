import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { CvDocument, type EditableField } from "@/components/CvDocument";
import {
  CV_TEMPLATES,
  type CVData,
  type CVTemplateId,
  type StructuredCVData,
  type SectionOrderItem,
  DEFAULT_SECTION_ORDER,
  DEFAULT_TEMPLATE,
} from "@/lib/cv-templates";
import { ArrowLeft, BookMarked, Download, GripVertical, LayoutList, Loader2, X, ImageIcon, Pencil } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { CvPdfDocument } from "@/components/CvPdfDocument";
import { registerFonts } from "@/lib/pdf-fonts";

export const Route = createFileRoute("/_authenticated/cv")({
  head: () => ({ meta: [{ title: "My CV · careerBloom" }] }),
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

function toStructuredData(data: CvData): StructuredCVData {
  return {
    name: data.full_name ?? "",
    title: data.title ?? "",
    summary: data.self_summary ?? "",
    contact: data.contact_details ?? [],
    experience: data.experience ?? [],
    education: data.studies ?? [],
    skills: data.skills ?? [],
    languages: data.languages ?? [],
    awards: data.awards ?? [],
    publications: data.publications ?? [],
    volunteer: data.volunteering ?? [],
    projects: data.projects ?? [],
    certifications: "",
    references: "",
    other: "",
    photo: undefined,
  }
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
  const [structuredData, setStructuredData] = useState<StructuredCVData | null>(null);
  const [actionErr, setActionErr] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<{version_id: string; cv_name: string; created_at: string}[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [editingItem, setEditingItem] = useState<{ field: keyof StructuredCVData; index: number; item: unknown } | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [editingPlain, setEditingPlain] = useState<{ field: EditableField; value: string } | null>(null);
  const [sectionOrder, setSectionOrder] = useState<SectionOrderItem[]>(() => {
    const saved = localStorage.getItem("cv-preview-section-order")
    return saved ? JSON.parse(saved) : DEFAULT_SECTION_ORDER
  })
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("cv-preview-photo");
    if (saved) setPhoto(saved);
  }, []);

  useEffect(() => {
    if (!cv) return;
    const base = toStructuredData(cv);
    const saved = localStorage.getItem("cv-preview-structured-edits");
    const merged = saved ? { ...base, ...JSON.parse(saved) } : base;
    setStructuredData(merged);

    const flatBase = toDocxData(cv);
    const savedFlat = localStorage.getItem("cv-preview-local-edits");
    const mergedFlat = savedFlat ? { ...flatBase, ...JSON.parse(savedFlat) } : flatBase;
    setMergedData(mergedFlat);
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
    localStorage.removeItem("cv-preview-local-edits")
    localStorage.removeItem("cv-preview-structured-edits")
    localStorage.removeItem("cv-preview-photo")
    localStorage.removeItem("cv-preview-section-order")
    if (cv) {
      setMergedData(toDocxData(cv))
      setStructuredData(toStructuredData(cv))
      const balanced = autoBalance(toStructuredData(cv))
      setSectionOrder(balanced)
      localStorage.setItem("cv-preview-section-order", JSON.stringify(balanced))
    }
    setPhoto(null)
  }

  useEffect(() => {
    if (!structuredData) return
    const saved = localStorage.getItem("cv-preview-section-order")
    if (!saved) {
      const balanced = autoBalance(structuredData)
      setSectionOrder(balanced)
      localStorage.setItem("cv-preview-section-order", JSON.stringify(balanced))
    }
  }, [structuredData])

  useEffect(() => {
    if (!editingItem) return;
    setEditDraft(editingItem.item as Record<string, string>);
  }, [editingItem]);

  function renderEditFields() {
    if (!editingItem) return null;
    const field = editingItem.field;

    const input = (key: string, label: string, multiline = false) => (
      <div key={key} className="mb-3">
        <label className="block text-xs text-foreground/60 mb-1">{label}</label>
        {multiline ? (
          <textarea
            value={editDraft[key] ?? ""}
            onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-foreground/10 bg-white/60 px-3 py-2 text-xs outline-none focus:border-foreground/30 resize-none"
          />
        ) : (
          <input
            type="text"
            value={editDraft[key] ?? ""}
            onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
            className="w-full rounded-xl border border-foreground/10 bg-white/60 px-3 py-2 text-xs outline-none focus:border-foreground/30"
          />
        )}
      </div>
    );

    if (field === "experience") return (
      <>
        {input("company", "Company / Role")}
        {input("city", "City")}
        {input("start_date", "Start date")}
        {input("end_date", "End date")}
        {input("comments", "Description", true)}
      </>
    );

    if (field === "education") return (
      <>
        {input("edu_center", "School / University")}
        {input("city", "City")}
        {input("start_date", "Start date")}
        {input("end_date", "End date")}
        {input("comments", "Notes", true)}
      </>
    );

    if (field === "skills") return input("skill", "Skill");

    if (field === "languages") return (
      <>
        {input("language", "Language")}
        {input("level", "Level")}
      </>
    );

    if (field === "contact") return input("detail", "Contact detail");

    return null;
  }

  function handleSaveEdit() {
    if (!editingItem || !structuredData) return;

    const field = editingItem.field;
    const arr = structuredData[field];
    if (!Array.isArray(arr)) return;

    const updated = arr.map((item, i) =>
      i === editingItem.index ? { ...item, ...editDraft } : item
    );

    const newData = { ...structuredData, [field]: updated };
    setStructuredData(newData);
    localStorage.setItem("cv-preview-structured-edits", JSON.stringify(newData));
    setEditingItem(null);
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
      const data = await api<CvData>(`/cv/versions/${version_id}`)
      const structured = toStructuredData(data)
      const flat = toDocxData(data)
      setStructuredData(structured)
      setMergedData(flat)
      localStorage.setItem("cv-preview-structured-edits", JSON.stringify(structured))
      saveLocalEdits(flat)
      setVersionsOpen(false)
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

  async function handlePhotoUpload(file: File) {
    const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"]
    const MIN_SIZE = 50 * 1024
    const MAX_SIZE = 5 * 1024 * 1024

    if (!VALID_TYPES.includes(file.type)) {
      setActionErr("Please upload a JPEG, PNG or WebP image")
      return
    }
    if (file.size < MIN_SIZE) {
      setActionErr("Image is too small — minimum 50KB")
      return
    }
    if (file.size > MAX_SIZE) {
      setActionErr("Image is too large — maximum 5MB")
      return
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45
    if (!isJpeg && !isPng && !isWebp) {
      setActionErr("Invalid image file")
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.src = objectUrl

    await new Promise<void>((resolve) => { img.onload = () => resolve() })

    const MAX_W = 400
    const MAX_H = 500
    const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1)
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.width * ratio)
    canvas.height = Math.round(img.height * ratio)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(objectUrl)

    const compressed = canvas.toDataURL("image/jpeg", 0.8)
    localStorage.setItem("cv-preview-photo", compressed)
    setPhoto(compressed)
  }

  async function handleExportPdf() {
    if (!structuredData) return
    setExporting(true)
    try {
      await registerFonts()
      const blob = await pdf(
        <CvPdfDocument data={{ ...structuredData, photo: photo ?? undefined }} template={selectedTemplate} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "careerbloom-cv.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("PDF export failed", e)
    } finally {
      setExporting(false)
    }
  }

  function autoBalance(data: StructuredCVData): SectionOrderItem[] {
    const sections = DEFAULT_SECTION_ORDER.filter(
      (item) => item.type === "section" &&
      (() => {
        const val = data[item.key as keyof StructuredCVData]
        return Array.isArray(val) ? val.length > 0 : Boolean(val)
      })()
    )

    const scores: Record<string, number> = {
      experience: 4, education: 3, skills: 2,
      languages: 1, contact: 1, awards: 2,
      publications: 2, volunteer: 2, projects: 2,
    }

    let colA = 0
    let colB = 0
    const page1: SectionOrderItem[] = []
    const page2: SectionOrderItem[] = []

    for (const item of sections) {
      if (item.type !== "section") continue
      const score = scores[item.key as string] ?? 1
      if (colA <= colB) {
        page1.push(item)
        colA += score
      } else {
        page2.push(item)
        colB += score
      }
    }

    return page1
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    const next = [...sectionOrder]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setSectionOrder(next)
    localStorage.setItem("cv-preview-section-order", JSON.stringify(next))
    setDragIndex(null)
    setDropIndex(null)
  }

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-foreground hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-display text-3xl">My CV</h1>
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
              onClick={() => void handleExportPdf()}
              disabled={exporting || !structuredData}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs text-background disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export PDF
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handlePhotoUpload(file)
                e.target.value = ""
              }}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
            >
              <ImageIcon className="h-3 w-3" /> {photo ? "Change Photo" : "Add Photo"}
            </button>
            {photo && (
              <button
                onClick={() => {
                  localStorage.removeItem("cv-preview-photo")
                  setPhoto(null)
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
              >
                Remove Photo
              </button>
            )}
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
            <button
              onClick={() => setSectionsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
            >
              <LayoutList className="h-3 w-3" /> Sections
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
          <div className="w-full flex justify-center overflow-x-auto py-8">
            {structuredData && (
              <CvDocument
                data={{ ...structuredData, photo: photo ?? undefined }}
                template={selectedTemplate}
                editable={false}
                onChange={handleChange}
                onEditItem={(field, index, item) => setEditingItem({ field, index, item })}
                onEditPlain={(field, value) => setEditingPlain({ field, value })}
                sectionOrder={sectionOrder}
              />
            )}
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
      {editingItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl bg-pink-50/80 backdrop-blur-md border border-white/50">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground capitalize">
                Edit {String(editingItem.field)}
              </h2>
              <button onClick={() => setEditingItem(null)}>
                <X className="h-4 w-4 text-foreground/50 hover:text-foreground" />
              </button>
            </div>
            <p className="text-xs text-foreground/50 mb-4">
              These changes are local only and won't affect your CareerBloom profile.
            </p>
            {renderEditFields()}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded-full bg-foreground px-4 py-2 text-xs text-background"
              >
                Save locally
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPlain && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl bg-pink-50/80 backdrop-blur-md border border-white/50">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground capitalize">Edit {editingPlain.field}</h2>
              <button onClick={() => setEditingPlain(null)}>
                <X className="h-4 w-4 text-foreground/50 hover:text-foreground" />
              </button>
            </div>
            <p className="text-xs text-foreground/50 mb-4">Local only — won't affect your profile.</p>
            <textarea
              value={editingPlain.value}
              onChange={(e) => setEditingPlain((p) => p ? { ...p, value: e.target.value } : null)}
              rows={editingPlain.field === "summary" ? 4 : 1}
              className="w-full rounded-xl border border-foreground/10 bg-white/60 px-3 py-2 text-xs outline-none focus:border-foreground/30 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditingPlain(null)}
                className="flex-1 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editingPlain) return;
                  handleChange(editingPlain.field, editingPlain.value);
                  setEditingPlain(null);
                }}
                className="flex-1 rounded-full bg-foreground px-4 py-2 text-xs text-background"
              >
                Save locally
              </button>
            </div>
          </div>
        </div>
      )}

      {sectionsOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setSectionsOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-80 bg-pink-50/95 backdrop-blur-md shadow-2xl flex flex-col p-6 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Sections</h2>
              <button onClick={() => setSectionsOpen(false)}>
                <X className="h-4 w-4 text-foreground/50 hover:text-foreground" />
              </button>
            </div>
            <p className="text-sm text-foreground/50">Drag to reorder. Add a page break to split across pages.</p>
            <button
              onClick={() => {
                const balanced = autoBalance(structuredData!)
                setSectionOrder(balanced)
                localStorage.setItem("cv-preview-section-order", JSON.stringify(balanced))
              }}
              className="rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
            >
              Re-balance
            </button>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {sectionOrder.map((item, i) => (
                item.type === "page-break" ? (
                  <div
                    key={`pb-${i}`}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDropIndex(i) }}
                    onDrop={() => handleDrop(i)}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-foreground/20 px-3 py-2 text-xs text-foreground/40 cursor-grab"
                  >
                    <GripVertical className="h-3 w-3" />
                    — Page break —
                    <button
                      className="ml-auto text-foreground/30 hover:text-rose-400"
                      onClick={() => {
                        const next = sectionOrder.filter((_, j) => j !== i)
                        setSectionOrder(next)
                        localStorage.setItem("cv-preview-section-order", JSON.stringify(next))
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={`${item.key}-${i}`}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDropIndex(i) }}
                    onDrop={() => handleDrop(i)}
                    className="flex items-center gap-2 rounded-2xl bg-white/80 border border-pink-100 px-4 py-3 cursor-grab"
                  >
                    <GripVertical className="h-4 w-4 text-foreground/30" />
                    <span className="text-sm font-medium text-foreground capitalize">{item.key}</span>
                  </div>
                )
              ))}
            </div>
            <button
              onClick={() => {
                const next = [...sectionOrder, { type: "page-break" as const }]
                setSectionOrder(next)
                localStorage.setItem("cv-preview-section-order", JSON.stringify(next))
              }}
              className="rounded-full border border-dashed border-foreground/20 px-4 py-2 text-xs text-foreground/50 hover:border-foreground/40 hover:text-foreground"
            >
              + Add page break
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
