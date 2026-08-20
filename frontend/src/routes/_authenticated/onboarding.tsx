import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession, sessionKeys } from "@/features/auth";
import { getOrCreateCareerDirection } from "@/lib/chat";
import { CvUploadModal } from "@/components/CvUploadModal";
import { Compass, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome · careerBloom" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.onboarding) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  async function openCareerDirection() {
    const id = await getOrCreateCareerDirection();
    if (id)
      navigate({
        to: "/chat/$conversationId",
        params: { conversationId: id },
      });
  }

  async function complete() {
    setSaving(true);
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
        <div className="mt-3 flex gap-1.5">
          {[1, 2].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-white/50"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="mt-8">
            <h1 className="font-display text-5xl leading-[1.05]">
              Welcome to <span className="italic">careerBloom</span>.
            </h1>
            <p className="mt-4 max-w-lg text-base text-foreground/75">
              A gentle, AI-powered companion for your career. We'll help you
              tell your story, build a CV that sounds like you, and write cover
              letters with warmth.
            </p>
            <p className="mt-6 max-w-md text-sm text-foreground/70">
              Upload your current CV — even a rough one. We'll read it
              carefully.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setUploadOpen(true)}
                className="flex-1 rounded-2xl bg-foreground px-6 py-4 text-sm text-background"
              >
                Upload CV (PDF or DOCX)
              </button>
              <button
                onClick={complete}
                className="flex-1 rounded-2xl bg-white/60 px-6 py-4 text-sm text-foreground/70 hover:bg-white"
              >
                Skip for now
              </button>
            </div>
            <CvUploadModal
              open={uploadOpen}
              onClose={() => setUploadOpen(false)}
              onDone={() => setStep(2)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-4xl">Where do you want to go?</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Chat with Bloom about your next move
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => void openCareerDirection()}
                className="rounded-3xl p-5 text-left transition-all bg-white/65 text-foreground hover:bg-white"
              >
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/60">
                  <Compass className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-2xl">Career Direction</p>
                <p className="mt-1 text-sm text-foreground/70">
                  Tell us where you're headed so we can tailor your advice.
                </p>
              </button>
            </div>
            <button
              disabled={saving}
              onClick={complete}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Ready to bloom
            </button>
            <button
              onClick={complete}
              className="mt-3 block text-sm text-foreground/60 underline-offset-4 hover:underline"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
