import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api, apiUpload, refreshAccessToken } from "@/lib/api";
import {
  Loader2,
  UploadCloud,
  Sparkles,
  X,
  FileText,
  Check,
} from "lucide-react";

type Status =
  | "idle"
  | "uploading"
  | "extracting"
  | "parsing"
  | "review"
  | "saving"
  | "done"
  | "error";

type ParsedCV = {
  name: string;
  title: string;
  contact: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  certifications: string;
  projects: string;
  volunteer: string;
  awards: string;
  publications: string;
  references: string;
  other: string;
};

const EMPTY: ParsedCV = {
  name: "",
  title: "",
  contact: "",
  summary: "",
  experience: "",
  education: "",
  skills: "",
  languages: "",
  certifications: "",
  projects: "",
  volunteer: "",
  awards: "",
  publications: "",
  references: "",
  other: "",
};

const SECTIONS: Array<keyof ParsedCV> = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "projects",
  "volunteer",
  "awards",
  "publications",
  "references",
  "other",
];

export function CvUploadModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ParsedCV>(EMPTY);
  const [extractedText, setExtractedText] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setFileName(null);
      setErrorMsg(null);
      setDragOver(false);
      setParsed(EMPTY);
      setExtractedText("");
    }
  }, [open]);

  if (!open) return null;

  async function handleFile(file: File) {
    setErrorMsg(null);
    const name = file.name.toLowerCase();
    const ok =
      name.endsWith(".pdf") ||
      name.endsWith(".docx") ||
      file.type === "application/pdf" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!ok) {
      setErrorMsg("Please upload a PDF or DOCX file.");
      return;
    }
    setFileName(file.name);

    try {
      setStatus("uploading");
      const uploadResult = await apiUpload<{ text: string }>(
        "/cv/upload",
        file,
      );
      setExtractedText(uploadResult.text);

      await refreshAccessToken();

      setStatus("parsing");
      const parsedData = await api<ParsedCV>("/cv/parse", {
        method: "POST",
        json: { text: uploadResult.text },
      });
      setParsed({ ...EMPTY, ...parsedData });
      setStatus("review");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  async function confirmSave() {
    setStatus("saving");
    setErrorMsg(null);
    try {
      const sectionEntries: Array<{
        section: string;
        content_en: string;
        content_es: string;
      }> = [];
      if (parsed.title.trim())
        sectionEntries.push({
          section: "title",
          content_en: parsed.title.trim(),
          content_es: "",
        });
      if (parsed.contact.trim())
        sectionEntries.push({
          section: "contact",
          content_en: parsed.contact.trim(),
          content_es: "",
        });
      for (const key of SECTIONS) {
        const value = parsed[key];
        if (value && value.trim())
          sectionEntries.push({
            section: key,
            content_en: value.trim(),
            content_es: "",
          });
      }

      await api("/cv/accept", {
        method: "POST",
        json: {
          file_name: fileName,
          extracted_text: extractedText,
          sections: sectionEntries,
        },
      });

      if (parsed.name.trim()) {
        await api("/profile", {
          method: "PATCH",
          json: { display_name: parsed.name.trim() },
        });
      }

      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Couldn't save");
      setStatus("error");
    }
  }

  function field<K extends keyof ParsedCV>(key: K, value: string) {
    setParsed((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-md">
      <div className="glass-strong relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 custom-scroll">
        <style>{`
          .custom-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.15);
            border-radius: 8px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.25);
          }
          .custom-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.15) transparent;
          }
        `}</style>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/60 text-foreground hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "idle" && (
          <>
            <h2 className="font-display text-3xl">Upload your CV</h2>
            <p className="mt-1 text-sm text-foreground/70">
              PDF or DOCX, up to 20MB. We'll read it gently and pre-fill your CV
              builder.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0])
                  handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`mt-6 grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver
                  ? "border-secondary bg-secondary/30"
                  : "border-foreground/20 bg-white/40 hover:bg-white/60"
              }`}
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-4 font-display text-xl">Drop your CV here</p>
              <p className="mt-1 text-xs text-foreground/60">
                or click to choose a file
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
            </div>

            {errorMsg && (
              <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}
          </>
        )}

        {(status === "uploading" ||
          status === "extracting" ||
          status === "parsing") && (
          <div className="py-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-secondary/40">
              <Loader2 className="h-7 w-7 animate-spin text-foreground" />
            </div>
            <p className="mt-5 font-display text-2xl italic">
              {status === "parsing"
                ? "Reading between the lines\u2026"
                : "Reading your story\u2026"}
            </p>
            <p className="mt-1 text-xs text-foreground/60">
              {status === "uploading"
                ? "Extracting text from your file"
                : status === "extracting"
                  ? "Listening to every word"
                  : "Organising it into your CV"}
            </p>
            {fileName && (
              <p className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs text-foreground/70">
                <FileText className="h-3 w-3" />{" "}
                <span className="truncate">{fileName}</span>
              </p>
            )}
          </div>
        )}

        {status === "review" && (
          <>
            <h2 className="font-display text-3xl">Review your CV</h2>
            <p className="mt-1 text-sm text-foreground/70">
              We pulled this from your file. Tweak anything that's off, then
              save to populate your builder. Nothing is saved until you click
              the button below.
            </p>

            <div className="mt-6 grid gap-3">
              <FieldRow label="Name">
                <input
                  value={parsed.name}
                  onChange={(e) => field("name", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Title">
                <input
                  value={parsed.title}
                  onChange={(e) => field("title", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Contact">
                <textarea
                  rows={3}
                  value={parsed.contact}
                  onChange={(e) => field("contact", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Summary">
                <textarea
                  rows={3}
                  value={parsed.summary}
                  onChange={(e) => field("summary", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Experience">
                <textarea
                  rows={6}
                  value={parsed.experience}
                  onChange={(e) => field("experience", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm font-mono outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Education">
                <textarea
                  rows={3}
                  value={parsed.education}
                  onChange={(e) => field("education", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Skills">
                <textarea
                  rows={3}
                  value={parsed.skills}
                  onChange={(e) => field("skills", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Languages">
                <textarea
                  rows={2}
                  value={parsed.languages}
                  onChange={(e) => field("languages", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Certifications">
                <textarea
                  rows={2}
                  value={parsed.certifications}
                  onChange={(e) => field("certifications", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Projects">
                <textarea
                  rows={3}
                  value={parsed.projects}
                  onChange={(e) => field("projects", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Volunteer">
                <textarea
                  rows={2}
                  value={parsed.volunteer}
                  onChange={(e) => field("volunteer", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Awards">
                <textarea
                  rows={2}
                  value={parsed.awards}
                  onChange={(e) => field("awards", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Publications">
                <textarea
                  rows={2}
                  value={parsed.publications}
                  onChange={(e) => field("publications", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="References">
                <textarea
                  rows={2}
                  value={parsed.references}
                  onChange={(e) => field("references", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
              <FieldRow label="Other">
                <textarea
                  rows={3}
                  value={parsed.other}
                  onChange={(e) => field("other", e.target.value)}
                  className="w-full rounded-xl bg-white/70 px-3 py-2 text-sm outline-none focus:bg-white"
                />
              </FieldRow>
            </div>

            {errorMsg && (
              <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}

            <p className="mt-4 text-center text-xs text-foreground/50">
              If you'd rather not store your name, email, or other contact
              details in the database, delete them from the fields above before
              accepting.
            </p>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-2xl bg-white/60 px-5 py-3 text-sm text-foreground/70 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background"
              >
                <Check className="h-4 w-4" /> Looks good, save to my CV
              </button>
            </div>
          </>
        )}

        {status === "saving" && (
          <div className="py-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-secondary/40">
              <Loader2 className="h-7 w-7 animate-spin text-foreground" />
            </div>
            <p className="mt-5 font-display text-2xl italic">
              Saving your story\u2026
            </p>
          </div>
        )}

        {status === "done" && (
          <div className="py-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-secondary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-5 font-display text-3xl">Got it!</p>
            <p className="mt-1 font-display italic text-foreground/70">
              Your CV builder is pre-filled.
            </p>
            <div className="mt-7 flex flex-col gap-2">
              <button
                onClick={() => {
                  onDone?.();
                  onClose();
                  navigate({ to: "/cv" });
                }}
                className="rounded-2xl bg-foreground py-3 text-sm font-medium text-background"
              >
                Open CV Builder
              </button>
              <button
                onClick={() => {
                  onDone?.();
                  onClose();
                  navigate({ to: "/chat" });
                }}
                className="rounded-2xl bg-secondary py-3 text-sm text-secondary-foreground"
              >
                Start chat with your coach
              </button>
              <button
                onClick={() => {
                  onDone?.();
                  onClose();
                }}
                className="rounded-2xl bg-white/60 py-3 text-sm text-foreground/70 hover:bg-white"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="py-8 text-center">
            <p className="font-display text-2xl">Hmm, that didn't work</p>
            <p className="mt-2 text-sm text-foreground/70">
              {errorMsg ?? "Please try again."}
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setErrorMsg(null);
              }}
              className="mt-6 rounded-2xl bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-foreground/60">
        {label}
      </span>
      {children}
    </label>
  );
}
