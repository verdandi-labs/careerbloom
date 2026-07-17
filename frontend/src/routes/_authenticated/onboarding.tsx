import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CvUploadModal } from "@/components/CvUploadModal";
import blossomAsset from "@/assets/blossom.jpg.asset.json";
import { ArrowRight, Compass, TrendingUp, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome · careerBloom" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [goal, setGoal] = useState<"switch" | "levelup" | null>(null);
  const [saving, setSaving] = useState(false);

  async function complete() {
    if (!goal) return;
    setSaving(true);
    await api("/profile", {
      method: "PATCH",
      json: { goal, onboarding_complete: true },
    });
    await refreshUser();
    navigate({ to: "/" });
  }

  return (
    <div
      className="relative grid min-h-screen place-items-center px-4 py-10"
      style={{
        backgroundImage: `url(${blossomAsset.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[oklch(0.918_0.034_18/0.4)] backdrop-blur-sm" />

      <div className="glass-strong relative z-10 w-full max-w-2xl p-10">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-foreground/60">
          <span>Step {step} of 3</span>
          <span>careerBloom</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-white/50"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="mt-8">
            <h1 className="font-display text-5xl leading-[1.05]">
              Welcome to <span className="italic">careerBloom</span>.
            </h1>
            <p className="mt-4 max-w-lg text-base text-foreground/75">
              A gentle, AI-powered companion for your career. We'll help you tell your story, build a CV that sounds
              like you, and write cover letters with warmth.
            </p>
            <button onClick={() => setStep(2)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground">
              Upload your CV to get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h1 className="font-display text-4xl">Share your story</h1>
            <p className="mt-2 max-w-md text-sm text-foreground/70">Upload your current CV — even a rough one. We'll read it carefully.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setUploadOpen(true)} className="flex-1 rounded-2xl bg-foreground px-6 py-4 text-sm text-background">Upload CV (PDF or DOCX)</button>
              <button onClick={() => setStep(3)} className="flex-1 rounded-2xl bg-white/60 px-6 py-4 text-sm text-foreground/70 hover:bg-white">Skip for now</button>
            </div>
            <CvUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onDone={() => setStep(3)} />
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <h1 className="font-display text-4xl">What are you looking for?</h1>
            <p className="mt-2 text-sm text-foreground/70">Pick the one that feels closest. You can change it later.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GoalCard icon={<Compass className="h-5 w-5" />} title="Switching industries" body="I want to move into something new and need help framing my story." active={goal === "switch"} onClick={() => setGoal("switch")} />
              <GoalCard icon={<TrendingUp className="h-5 w-5" />} title="Leveling up in my field" body="I'm growing in my current path and want to land a stronger role." active={goal === "levelup"} onClick={() => setGoal("levelup")} />
            </div>
            <button disabled={!goal || saving} onClick={complete} className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Ready to bloom
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalCard({ icon, title, body, active, onClick }: { icon: React.ReactNode; title: string; body: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-3xl p-5 text-left transition-all ${active ? "bg-accent text-accent-foreground shadow-[0_12px_30px_-12px_rgba(248,175,166,0.9)]" : "bg-white/65 text-foreground hover:bg-white"}`}>
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/60">{icon}</div>
      <p className="mt-4 font-display text-2xl">{title}</p>
      <p className="mt-1 text-sm text-foreground/70">{body}</p>
    </button>
  );
}
