import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth";
import { API_BASE, apiUpload } from "@/lib/api";
import { Check, FileText, Loader2, UploadCloud, X } from "lucide-react";

type CvRawText = {
  text: string;
};

type Status = "idle" | "uploading" | "review" | "saving" | "error";

type SaveStage = "opening" | "reading" | "almost";

const SAVE_STAGES: Array<{ key: SaveStage; label: string }> = [
  { key: "opening", label: "Opening your CV" },
  { key: "reading", label: "Reading your story" },
  { key: "almost", label: "Almost there" },
];

export function CvUploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saveStage, setSaveStage] = useState<SaveStage>("opening");
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useSession();

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setFileName(null);
      setText("");
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
      const result = await apiUpload<CvRawText>("/cv/upload", file);
      setText(result.text);
      setStatus("review");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  async function handleSave() {
    if (!text.trim()) return;
    setErrorMsg(null);
    setSaveStage("opening");
    setStatus("saving");
    try {
      const res = await fetch(`${API_BASE}/cv/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = JSON.parse(trimmed.slice(5).trim());
          if (payload.stage) setSaveStage(payload.stage);
          if (payload.error) throw new Error(payload.error);
          if (payload.done) finished = true;
        }
      }
      if (!finished)
        throw new Error("Could not parse your CV, please try again");

      // Ping /auth/me so the plain JSON response commits the rotated session
      // cookie through FastAPI's normal header-merge path before we refetch.
      // Without this, GET /cv fires with a token that isn't committed yet
      // (the streaming response commits lazily at stream teardown).
      await fetch(`${API_BASE}/auth/me`, { credentials: "include" });

      await qc.invalidateQueries({ queryKey: ["cv"] });
      if (!user?.onboarding) {
        await qc.invalidateQueries({ queryKey: ["session"] });
      }
      onClose();
      navigate({ to: "/cv" });
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setStatus("review");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-md">
      <div className="glass-strong relative w-full max-w-2xl p-8">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white/60 text-foreground hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "idle" && (
          <>
            <h2 className="font-display text-3xl">Upload your CV</h2>
            <p className="mt-1 text-sm text-foreground/70">
              PDF, DOCX, or TXT format, size: 20KB-5MB. We'll read your file and
              fill your CV builder.
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
              Reading your story
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
          <div>
            <h2 className="font-display text-3xl">Review your CV text</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Review your CV text before saving. You can remove anything you
              don't want to share.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={20}
              className="mt-6 w-full resize-y rounded-2xl border border-foreground/10 bg-white/50 p-4 font-mono text-base text-foreground/90 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />

            {errorMsg && (
              <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!text.trim()}
                className="rounded-2xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground disabled:opacity-50"
              >
                Save CV
              </button>
              <button
                onClick={() => {
                  setStatus("idle");
                  setText("");
                  setErrorMsg(null);
                }}
                className="rounded-2xl bg-white/60 px-6 py-3 text-sm font-medium text-foreground/70 hover:bg-white"
              >
                Choose another file
              </button>
            </div>
          </div>
        )}

        {status === "saving" && (
          <div className="py-10 text-center">
            <p className="font-display text-2xl italic">Saving your CV</p>
            <div className="mx-auto mt-6 flex w-fit flex-col gap-3">
              {SAVE_STAGES.map((stage, i) => {
                const currentIndex = SAVE_STAGES.findIndex(
                  (s) => s.key === saveStage,
                );
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-3 text-sm ${done ? "text-foreground/50" : active ? "text-foreground" : "text-foreground/35"}`}
                  >
                    {done ? (
                      <Check className="h-4 w-4 text-green" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-foreground/20" />
                    )}
                    {stage.label}
                  </div>
                );
              })}
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
