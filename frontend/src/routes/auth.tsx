import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { MagicLinkScreen } from "@/components/auth/MagicLinkScreen";
import { PINScreen } from "@/components/auth/PINScreen";
import { BYODBScreen } from "@/components/auth/BYODBScreen";
import blossomAsset from "@/assets/blossom.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · careerBloom" },
      {
        name: "description",
        content: "Sign in to careerBloom and keep blooming.",
      },
    ],
  }),
  component: AuthLayout,
});

const steps = [
  { key: "email", label: "Sign in" },
  { key: "pin", label: "Create password" },
  { key: "byodb", label: "Connect database" },
] as const;

function AuthLayout() {
  const location = useRouterState({ select: (s) => s.location });
  const isChildRoute = location.pathname !== "/auth";

  if (isChildRoute) {
    return (
      <div
        className="relative min-h-screen"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(249,241,240,0.4), rgba(250,220,217,0.6)), url(${blossomAsset.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    );
  }

  return <AuthPage />;
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "pin" | "byodb">("email");
  const [authEmail, setAuthEmail] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(249,241,240,0.4), rgba(250,220,217,0.6)), url(${blossomAsset.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
        <header className="rounded-[20px] bg-secondary/70 px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] backdrop-blur-md">
          <img src="/logo.png" alt="careerBloom" className="mb-3 h-8 w-auto" />
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
            Step {currentIdx + 1} of {steps.length}
          </p>
          <h1 className="mt-1 font-display text-3xl">
            {step === "email" && "Sign in to careerBloom"}
            {step === "pin" && "Create your password"}
            {step === "byodb" && "Bring your own database"}
          </h1>
          <p className="mt-1 text-sm text-foreground/75">
            {step === "email" &&
              "No password needed. Drop your email and we'll send a magic link."}
            {step === "pin" &&
              "Set a password to secure your account for future sign-ins."}
            {step === "byodb" &&
              "Optional: connect your own Supabase to keep data private."}
          </p>
        </header>

        <section className="glass p-6">
          {step === "email" && (
            <MagicLinkScreen
              onSent={(email) => {
                setAuthEmail(email);
                setStep("pin");
              }}
            />
          )}
          {step === "pin" && (
            <PINScreen email={authEmail} onDone={() => setStep("byodb")} />
          )}
          {step === "byodb" && <BYODBScreen email={authEmail} />}
        </section>

        <p className="text-center text-[11px] uppercase tracking-[0.22em] text-foreground/50">
          careerBloom — keep blooming.
        </p>
      </div>
    </div>
  );
}
