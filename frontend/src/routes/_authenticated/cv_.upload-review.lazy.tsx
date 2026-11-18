import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/features/auth";
import { isSupportedCvFile, useCvUploadStore } from "@/features/cv";
import { API_BASE, apiUpload } from "@/lib/api";
import { Check, FileText, Loader2, UploadCloud } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/cv_/upload-review")({
  component: UploadReviewPage,
});

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

function UploadReviewPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useSession();
  const file = useCvUploadStore((state) => state.file);
  const setFile = useCvUploadStore((state) => state.setFile);
  const clear = useCvUploadStore((state) => state.clear);
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saveStage, setSaveStage] = useState<SaveStage>("opening");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (selected: File) => {
    setFileName(selected.name);
    setErrorMsg(null);
    setStatus("uploading");
    try {
      const result = await apiUpload<CvRawText>("/cv/upload", selected);
      setText(result.text);
      setStatus("review");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (file) void uploadFile(file);
  }, [file, uploadFile]);

  function handlePick(selected: File) {
    setErrorMsg(null);
    if (!isSupportedCvFile(selected)) {
      setErrorMsg("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (selected === file) {
      void uploadFile(selected);
      return;
    }
    setFile(selected);
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

      const pingMe = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });
      if (!pingMe.ok) {
        await new Promise((r) => setTimeout(r, 150));
        await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      }

      clear();
      navigate({ to: "/cv" });
      qc.invalidateQueries({ queryKey: ["cv"] });
      if (!user?.onboarding) {
        qc.invalidateQueries({ queryKey: ["session"] });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setStatus("review");
    }
  }

  return (
    <AppShell>
      <div className="glass-strong relative mx-auto w-full max-w-3xl p-8">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          hidden
          onChange={(e) => {
            const selected = e.target.files?.[0];
            e.target.value = "";
            if (selected) handlePick(selected);
          }}
        />

        {status === "idle" && (
          <>
            <h1 className="font-display text-3xl">Upload your CV</h1>
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
                const selected = e.dataTransfer.files?.[0];
                if (selected) handlePick(selected);
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
            </div>

            {errorMsg && (
              <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}
          </>
        )}

        {status === "uploading" && (
          <div className="py-16 text-center">
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
            <h1 className="font-display text-3xl">Review your CV text</h1>
            <p className="mt-1 text-sm text-foreground/70">
              Review your CV text before saving. You can remove anything you
              don't want to share.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-6 block h-[60vh] w-full resize-none overflow-y-auto rounded-2xl border border-foreground/10 bg-white/50 p-4 font-mono text-base text-foreground/90 outline-none [scrollbar-width:none] focus:border-accent focus:ring-1 focus:ring-accent/30 [&::-webkit-scrollbar]:hidden"
            />

            {errorMsg && (
              <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {errorMsg}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => void handleSave()}
                disabled={!text.trim()}
                className="rounded-2xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground disabled:opacity-50"
              >
                Save CV
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                className="rounded-2xl bg-white/60 px-6 py-3 text-sm font-medium text-foreground/70 hover:bg-white"
              >
                Choose another file
              </button>
            </div>
          </div>
        )}

        {status === "saving" && (
          <div className="py-16 text-center">
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
          <div className="py-12 text-center">
            <p className="font-display text-2xl">Hmm, that didn't work</p>
            <p className="mt-2 text-sm text-foreground/70">
              {errorMsg ?? "Please try again."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => file && void uploadFile(file)}
                className="rounded-2xl bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground"
              >
                Try again
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                className="rounded-2xl bg-white/60 px-5 py-3 text-sm font-medium text-foreground/70 hover:bg-white"
              >
                Choose another file
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
