import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { completeOnboarding, useSession, sessionKeys } from "@/features/auth";
import { isSupportedCvFile, useCvUploadStore } from "@/features/cv";

export const Route = createLazyFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useSession();
  const setUploadFile = useCvUploadStore((state) => state.setFile);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  function handleUploadPick(selected: File) {
    if (!isSupportedCvFile(selected)) return;
    setUploadFile(selected);
    void navigate({ to: "/cv/upload-review" });
  }

  useEffect(() => {
    if (user?.onboarding) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  async function complete() {
    setSaving(true);
    await completeOnboarding();
    await qc.invalidateQueries({ queryKey: sessionKeys.all });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="fixed-bg fixed-bg--bare" />
      <div className="pointer-events-none absolute inset-0 bg-[oklch(0.918_0.034_18/0.4)] backdrop-blur-sm" />

      <div className="glass-strong relative z-10 w-full max-w-2xl p-10">
        <div className="text-right text-[11px] uppercase tracking-[0.22em] text-foreground/60">
          <span>careerBloom</span>
        </div>

        <div className="mt-8">
          <h1 className="font-display text-5xl leading-[1.05]">
            Welcome to <span className="italic">careerBloom</span>.
          </h1>
          <p className="mt-4 max-w-lg text-base text-foreground/75">
            A gentle, AI-powered companion for your career. We'll help you tell
            your story, build a CV that sounds like you, and write cover letters
            with warmth.
          </p>
          <p className="mt-6 max-w-md text-sm text-foreground/70">
            Upload your current CV — even a rough one. We'll read it carefully.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              hidden
              onChange={(e) => {
                const selected = e.target.files?.[0];
                e.target.value = "";
                if (selected) handleUploadPick(selected);
              }}
            />
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="flex-1 rounded-2xl bg-foreground px-6 py-4 text-sm text-background"
            >
              Upload CV (PDF or DOCX)
            </button>
            <button
              disabled={saving}
              onClick={complete}
              className="flex-1 rounded-2xl bg-white/60 px-6 py-4 text-sm text-foreground/70 hover:bg-white disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
