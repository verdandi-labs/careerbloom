import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { api, errorMessage } from "@/lib/api";
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
import { LANGUAGES } from "@/lib/languages";
import {
  ArrowLeft,
  BookMarked,
  Download,
  Languages,
  Loader2,
  Save,
  X,
  ImageIcon,
} from "lucide-react";
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

type TranslatedCv = { data: CvData; code: string; label: string };

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

const saveVersion = (cv_name: string, data?: CvData) =>
  api<{ version_id: string; cv_name: string; created_at: string }>(
    "/cv/versions",
    {
      method: "POST",
      json: { cv_name, data: data ?? null },
    },
  );
const replaceVersion = (version_id: string, cv_name: string, data?: CvData) =>
  api<{ version_id: string; cv_name: string; created_at: string }>(
    `/cv/versions/${version_id}`,
    {
      method: "PUT",
      json: { cv_name, data: data ?? null },
    },
  );

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
  const [structuredData, setStructuredData] = useState<StructuredCVData | null>(
    null,
  );
  const [actionErr, setActionErr] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<
    { version_id: string; cv_name: string; created_at: string }[]
  >([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(() =>
    localStorage.getItem("cv-preview-photo"),
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [editingItem, setEditingItem] = useState<{
    field: keyof StructuredCVData;
    index: number;
    item: unknown;
  } | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [sectionOrder, setSectionOrder] = useState<SectionOrderItem[]>(() => {
    const saved = localStorage.getItem("cv-preview-section-order");
    return saved ? JSON.parse(saved) : DEFAULT_SECTION_ORDER;
  });
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNameErr, setSaveNameErr] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveFromTranslate, setSaveFromTranslate] = useState(false);
  const [saveModalMode, setSaveModalMode] = useState<"save" | "replace">(
    "save",
  );
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<TranslatedCv | null>(null);
  const [pdfScale, setPdfScale] = useState(1.0);

  useEffect(() => {
    if (!cv) return;
    const base = toStructuredData(cv);
    const saved = localStorage.getItem("cv-preview-structured-edits");
    const merged = saved ? { ...base, ...JSON.parse(saved) } : base;
    setStructuredData(merged);

    const flatBase = toDocxData(cv);
    const savedFlat = localStorage.getItem("cv-preview-local-edits");
    const mergedFlat = savedFlat
      ? { ...flatBase, ...JSON.parse(savedFlat) }
      : flatBase;
    setMergedData(mergedFlat);
  }, [cv]);

  function handleChange(field: EditableField, value: string) {
    setMergedData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      saveLocalEdits(next);
      return next;
    });
    const structuredFieldMap: Partial<
      Record<EditableField, keyof StructuredCVData>
    > = {
      name: "name",
      title: "title",
      summary: "summary",
    };
    const structuredField = structuredFieldMap[field];
    if (structuredField) {
      setStructuredData((prev) => {
        if (!prev) return prev;
        const next = { ...prev, [structuredField]: value };
        localStorage.setItem(
          "cv-preview-structured-edits",
          JSON.stringify(next),
        );
        return next;
      });
    }
  }

  function handleReset() {
    localStorage.removeItem("cv-preview-local-edits");
    localStorage.removeItem("cv-preview-structured-edits");
    localStorage.removeItem("cv-preview-photo");
    localStorage.removeItem("cv-preview-section-order");
    if (cv) {
      setMergedData(toDocxData(cv));
      setStructuredData(toStructuredData(cv));
      const balanced = autoBalance(toStructuredData(cv));
      setSectionOrder(balanced);
      localStorage.setItem(
        "cv-preview-section-order",
        JSON.stringify(balanced),
      );
    }
    setPhoto(null);
  }

  useEffect(() => {
    if (!structuredData) return;
    const saved = localStorage.getItem("cv-preview-section-order");
    if (!saved) {
      const balanced = autoBalance(structuredData);
      setSectionOrder(balanced);
      localStorage.setItem(
        "cv-preview-section-order",
        JSON.stringify(balanced),
      );
    }
  }, [structuredData]);

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
            onChange={(e) =>
              setEditDraft((d) => ({ ...d, [key]: e.target.value }))
            }
            rows={3}
            className="w-full rounded-xl border border-foreground/10 bg-white/60 px-3 py-2 text-xs outline-none focus:border-foreground/30 resize-none"
          />
        ) : (
          <input
            type="text"
            value={editDraft[key] ?? ""}
            onChange={(e) =>
              setEditDraft((d) => ({ ...d, [key]: e.target.value }))
            }
            className="w-full rounded-xl border border-foreground/10 bg-white/60 px-3 py-2 text-xs outline-none focus:border-foreground/30"
          />
        )}
      </div>
    );

    if (field === "experience")
      return (
        <>
          {input("company", "Company / Role")}
          {input("city", "City")}
          {input("start_date", "Start date")}
          {input("end_date", "End date")}
          {input("comments", "Description", true)}
        </>
      );

    if (field === "education")
      return (
        <>
          {input("edu_center", "School / University")}
          {input("city", "City")}
          {input("start_date", "Start date")}
          {input("end_date", "End date")}
          {input("comments", "Notes", true)}
        </>
      );

    if (field === "skills") return input("skill", "Skill");

    if (field === "languages")
      return (
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
      i === editingItem.index ? { ...item, ...editDraft } : item,
    );

    const newData = { ...structuredData, [field]: updated };
    setStructuredData(newData);
    localStorage.setItem(
      "cv-preview-structured-edits",
      JSON.stringify(newData),
    );
    setEditingItem(null);
  }

  async function fetchVersions() {
    setVersionsLoading(true);
    try {
      const v =
        await api<
          { version_id: string; cv_name: string; created_at: string }[]
        >("/cv/versions");
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
      const structured = toStructuredData(data);
      const flat = toDocxData(data);
      setStructuredData(structured);
      setMergedData(flat);
      localStorage.setItem(
        "cv-preview-structured-edits",
        JSON.stringify(structured),
      );
      saveLocalEdits(flat);
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

  async function handleSaveVersion() {
    if (!saveName.trim()) {
      setSaveNameErr("Please enter a name");
      return;
    }
    setSaveNameErr("");
    setSaveLoading(true);
    try {
      const dataToSave =
        saveFromTranslate && translated ? translated.data : undefined;
      if (replaceTarget) {
        await replaceVersion(replaceTarget, saveName.trim(), dataToSave);
      } else {
        await saveVersion(saveName.trim(), dataToSave);
      }
      setSaveSuccess(replaceTarget ? "Replaced!" : "Saved!");
      setSaveName("");
      setReplaceTarget(null);
      await fetchVersions();
      setTimeout(() => {
        setSaveSuccess("");
        setSaveModalOpen(false);
      }, 1200);
    } catch (e) {
      setSaveNameErr(
        errorMessage(e, "Could not save version, please try again"),
      );
    } finally {
      setSaveLoading(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MIN_SIZE = 50 * 1024;
    const MAX_SIZE = 5 * 1024 * 1024;

    if (!VALID_TYPES.includes(file.type)) {
      setActionErr("Please upload a JPEG, PNG or WebP image");
      return;
    }
    if (file.size < MIN_SIZE) {
      setActionErr("Image is too small — minimum 50KB");
      return;
    }
    if (file.size > MAX_SIZE) {
      setActionErr("Image is too large — maximum 5MB");
      return;
    }

    setPhotoUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
      const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45;
      if (!isJpeg && !isPng && !isWebp) {
        setActionErr("Invalid image file");
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      const MAX_W = 400;
      const MAX_H = 500;
      const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);

      const compressed = canvas.toDataURL("image/jpeg", 0.8);
      localStorage.setItem("cv-preview-photo", compressed);
      setPhoto(compressed);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleExportPdf() {
    if (!structuredData) return;
    setExporting(true);
    try {
      await registerFonts();
      const blob = await pdf(
        <CvPdfDocument
          data={{ ...structuredData, photo: photo ?? undefined }}
          template={selectedTemplate}
          sectionOrder={sectionOrder}
          pdfScale={pdfScale}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "careerbloom-cv.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export failed", e);
      setActionErr(
        `PDF export failed: ${e instanceof Error ? `${e.message}\n${e.stack}` : "unknown error"}`,
      );
    } finally {
      setExporting(false);
    }
  }

  function autoBalance(data: StructuredCVData): SectionOrderItem[] {
    const sections = DEFAULT_SECTION_ORDER.filter(
      (item) =>
        item.type === "section" &&
        (() => {
          const val = data[item.key as keyof StructuredCVData];
          return Array.isArray(val) ? val.length > 0 : Boolean(val);
        })(),
    );

    const scores: Record<string, number> = {
      experience: 4,
      education: 3,
      skills: 2,
      languages: 1,
      contact: 1,
      awards: 2,
      publications: 2,
      volunteer: 2,
      projects: 2,
    };

    const colA: SectionOrderItem[] = [];
    const colB: SectionOrderItem[] = [];
    let scoreA = 0;
    let scoreB = 0;

    for (const item of sections) {
      if (item.type !== "section") continue;
      const score = scores[item.key as string] ?? 1;
      if (scoreA <= scoreB) {
        colA.push(item);
        scoreA += score;
      } else {
        colB.push(item);
        scoreB += score;
      }
    }

    const result: SectionOrderItem[] = [];
    const maxLen = Math.max(colA.length, colB.length);
    for (let i = 0; i < maxLen; i++) {
      if (colA[i]) result.push(colA[i]);
      if (colB[i]) result.push(colB[i]);
    }
    return result;
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
              onClick={() => void handleExportPdf()}
              disabled={exporting || !structuredData}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs text-background hover:opacity-50 transition-opacity duration-150 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export PDF
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePhotoUpload(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
            >
              <ImageIcon className="h-3 w-3" />{" "}
              {photo ? "Change Photo" : "Add Photo"}
            </button>
            {photo && (
              <button
                onClick={() => {
                  localStorage.removeItem("cv-preview-photo");
                  setPhoto(null);
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
              onClick={() => {
                setVersionsOpen(true);
                void fetchVersions();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
            >
              <BookMarked className="h-3 w-3" /> Load Saved CV
            </button>
            <button
              onClick={() => {
                setSaveModalOpen(true);
                void fetchVersions();
              }}
              disabled={!cv}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white disabled:opacity-50"
            >
              <Save className="h-3 w-3" /> Save CV
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
          <div className="w-full flex flex-col items-center overflow-x-auto py-8 gap-6">
            {structuredData && (
              <>
                <div className="flex items-center gap-2 self-end">
                  <button
                    onClick={() =>
                      setPdfScale((s) => Math.max(0.85, +(s - 0.05).toFixed(2)))
                    }
                    disabled={pdfScale <= 0.85}
                    className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm text-foreground hover:bg-white/80 disabled:opacity-50 shadow-sm"
                  >
                    −
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(pdfScale * 100)}%
                  </span>
                  <button
                    onClick={() =>
                      setPdfScale((s) => Math.min(1.1, +(s + 0.05).toFixed(2)))
                    }
                    disabled={pdfScale >= 1.1}
                    className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm text-foreground hover:bg-white/80 disabled:opacity-50 shadow-sm"
                  >
                    +
                  </button>
                </div>
                <CvDocument
                    pdfScale={pdfScale}
                    data={{ ...structuredData, photo: photo ?? undefined }}
                    template={selectedTemplate}
                    editable={true}
                    onChange={handleChange}
                    onEditItem={(field, index, item) =>
                      setEditingItem({ field, index, item })
                    }
                    sectionOrder={sectionOrder}
                    onDragSection={(from, to) => {
                      const next = [...sectionOrder];
                      const [moved] = next.splice(from, 1);
                      next.splice(to, 0, moved);
                      setSectionOrder(next);
                      localStorage.setItem(
                        "cv-preview-section-order",
                        JSON.stringify(next),
                      );
                      setActiveDragIndex(null);
                    }}
                    activeDragIndex={activeDragIndex}
                    setActiveDragIndex={setActiveDragIndex}
                    photoUploading={photoUploading}
                  />
              </>
            )}
          </div>
        ) : null}
      </section>

      {versionsOpen && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setVersionsOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-96 bg-pink-50/95 backdrop-blur-md shadow-2xl flex flex-col p-6 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Load Saved CV
              </h2>
              <button onClick={() => setVersionsOpen(false)}>
                <X className="h-4 w-4 text-foreground/50 hover:text-foreground" />
              </button>
            </div>
            <p className="text-sm text-foreground/50">
              You can save up to 6 CV versions. {versions.length} / 6 saved.
            </p>
            {versionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-foreground/40 text-center py-8">
                No saved versions yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.version_id}
                    className="rounded-2xl bg-white/80 shadow-sm border border-pink-100 px-4 py-3 flex flex-col gap-2"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {v.cv_name}
                    </p>
                    <p className="text-xs text-foreground/40">
                      {new Date(v.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => void handleLoadVersion(v.version_id)}
                        className="flex-1 rounded-full bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-80 transition"
                      >
                        Load
                      </button>
                      {deletingVersionId === v.version_id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground/60">
                            Delete?
                          </span>
                          <button
                            onClick={() => {
                              void handleDeleteVersion(v.version_id);
                              setDeletingVersionId(null);
                            }}
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
              These changes are local only and won't affect your CareerBloom
              profile.
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

      {translated && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-md">
          <div className="glass-strong relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-8">
            <button
              onClick={() => {
                setTranslated(null);
                setSaveFromTranslate(false);
                setSaveModalMode("save");
              }}
              className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white/60 text-foreground hover:bg-white"
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
            <div className="mt-6 border-t border-foreground/10 pt-4 flex gap-3">
              <button
                onClick={() => {
                  setSaveFromTranslate(true);
                  setSaveModalMode("save");
                  setSaveModalOpen(true);
                  void fetchVersions();
                }}
                disabled={versions.length >= 6}
                className="flex-1 rounded-full bg-foreground px-4 py-2 text-xs text-background disabled:opacity-40"
              >
                {versions.length >= 6
                  ? "Max versions reached"
                  : "Save as new version"}
              </button>
              <button
                onClick={() => {
                  setSaveFromTranslate(true);
                  setSaveModalMode("replace");
                  setSaveModalOpen(true);
                  void fetchVersions();
                }}
                className="flex-1 rounded-full bg-white/70 px-4 py-2 text-xs text-foreground hover:bg-white"
              >
                Replace existing version
              </button>
            </div>
          </div>
        </div>
      )}

      {saveModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 backdrop-blur-md">
          <div className="glass-strong w-full max-w-md rounded-2xl p-6 shadow-xl bg-pink-50/80">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {replaceTarget
                  ? "Confirm Replace"
                  : versions.length >= 6
                    ? "Replace a CV Version"
                    : "Save CV Version"}
              </h2>
              <button
                onClick={() => {
                  setSaveModalOpen(false);
                  setSaveFromTranslate(false);
                  setSaveModalMode("save");
                  setSaveName("");
                  setSaveNameErr("");
                  setReplaceTarget(null);
                  setSaveSuccess("");
                }}
              >
                <X className="h-4 w-4 text-foreground/50 hover:text-foreground" />
              </button>
            </div>

            {saveSuccess && (
              <p className="mb-2 text-xs text-green-500">{saveSuccess}</p>
            )}

            {replaceTarget ? (
              <>
                <p className="mb-3 text-xs text-foreground/50">
                  Replacing:{" "}
                  <span className="font-medium text-foreground/70">
                    {
                      versions.find((v) => v.version_id === replaceTarget)
                        ?.cv_name
                    }
                  </span>
                </p>
                <input
                  type="text"
                  placeholder="Version name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="mb-1 w-full rounded-xl border border-foreground/10 bg-white/60 px-3 py-2 text-xs outline-none focus:border-foreground/30"
                />
                {saveNameErr && (
                  <p className="mb-2 text-xs text-red-400">{saveNameErr}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setReplaceTarget(null);
                      setSaveName("");
                    }}
                    className="rounded-full border border-foreground/10 px-4 py-2 text-xs text-foreground/60 hover:border-foreground/30 hover:text-foreground"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveVersion}
                    disabled={saveLoading}
                    className="flex-1 rounded-full bg-foreground px-4 py-2 text-xs text-background disabled:opacity-50"
                  >
                    {saveLoading ? "Replacing..." : "Replace"}
                  </button>
                </div>
              </>
            ) : versions.length >= 6 ? (
              <>
                <p className="mb-3 text-xs text-foreground/50">
                  You have 6 saved versions. Which one would you like to
                  replace?
                </p>
                <div className="flex flex-col gap-2">
                  {versions.map((v) => (
                    <button
                      key={v.version_id}
                      onClick={() => {
                        setReplaceTarget(v.version_id);
                        setSaveName(v.cv_name);
                      }}
                      className="flex items-center justify-between rounded-xl border border-foreground/10 bg-white/60 px-4 py-3 text-left transition hover:border-foreground/20 hover:bg-white"
                    >
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {v.cv_name}
                        </p>
                        <p className="text-[11px] text-foreground/40">
                          {new Date(v.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-[11px] text-foreground/30">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-xs text-foreground/50">
                  You can save up to 6 CV versions. {versions.length} / 6 saved.
                </p>
                <input
                  type="text"
                  placeholder="e.g. CV English, CV Tech roles"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="mb-1 w-full rounded-xl border border-foreground/10 bg-white/60 px-3 py-2 text-xs outline-none focus:border-foreground/30"
                />
                {saveNameErr && (
                  <p className="mb-2 text-xs text-red-400">{saveNameErr}</p>
                )}
                <button
                  onClick={handleSaveVersion}
                  disabled={saveLoading}
                  className="mt-3 w-full rounded-full bg-foreground px-4 py-2 text-xs text-background disabled:opacity-50"
                >
                  {saveLoading ? "Saving..." : "Save as new version"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
