import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession, sessionKeys } from "@/features/auth";
import { apiUpload } from "@/lib/api";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";

type Status = "idle" | "uploading" | "error";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { data: user } = useSession();

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setFileName(null);
      setErrorMsg(null);
      setDragOver(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleFile(file: File) {
    setErrorMsg(null);
    const name = file.name.toLowerCase();
    if (
      !name.endsWith(".pdf") &&
      !name.endsWith(".docx") &&
      !name.endsWith(".txt")
    ) {
      setErrorMsg("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setFileName(file.name);
    setStatus("uploading");
    try {
      await apiUpload("/cv/upload", file);
      await qc.invalidateQueries({ queryKey: ["cv"] });
      if (!user?.onboarding) {
        await qc.invalidateQueries({ queryKey: sessionKeys.all });
      }
      onDone?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-md">
      <div className="glass-strong relative w-full max-w-2xl p-8">
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
              PDF, DOCX, or TXT format, size: 20KB\u20135MB. We'll read your
              file and fill your CV builder.
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
                accept=".pdf,.docx,.txt"
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

        {status === "uploading" && (
          <div className="py-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-secondary/40">
              <Loader2 className="h-7 w-7 animate-spin text-foreground" />
            </div>
            <p className="mt-5 font-display text-2xl italic">
              Reading your story\u2026
            </p>
            {fileName && (
              <p className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs text-foreground/70">
                <FileText className="h-3 w-3" />{" "}
                <span className="truncate">{fileName}</span>
              </p>
            )}
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
