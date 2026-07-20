import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Check, Loader2, Shield } from "lucide-react";
import blossomAsset from "@/assets/blossom.jpg.asset.json";

export const Route = createFileRoute("/auth/set-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Set Password · careerBloom" }] }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const search = useSearch({ from: "/auth/set-password" });
  const token = (search as { token?: string }).token || "";
  const email = (search as { email?: string }).email || "";

  const [step, setStep] = useState<"verifying" | "form" | "done">("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid link");
      setStep("form");
      return;
    }
    api(
      `/auth/magic?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
    )
      .then(() => setStep("form"))
      .catch(() => {
        setError("Link expired or invalid. Request a new magic link.");
        setStep("form");
      });
  }, [token, email]);

  async function handleSubmit() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const res = await api<{ access_token: string; email: string }>(
        "/auth/password",
        {
          method: "POST",
          json: { email, password },
        },
      );
      setTokens(res.access_token, "");
      localStorage.setItem("auth_email", res.email);
      await refreshUser();
      setStep("done");
      setTimeout(
        () => navigate({ to: "/connect-database", replace: true }),
        1500,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password.");
    } finally {
      setSaving(false);
    }
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
      <div className="pointer-events-none absolute inset-0 bg-[oklch(0.918_0.034_18/0.35)] backdrop-blur-sm" />

      {step === "verifying" && (
        <div className="glass-strong relative z-10 w-full max-w-md p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-accent" />
          <p className="text-foreground/70">Verifying your link...</p>
        </div>
      )}

      {step === "done" && (
        <div className="glass-strong relative z-10 w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl text-green-700">
            Password set!
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Taking you to the next step...
          </p>
        </div>
      )}

      {step === "form" && (
        <div className="glass-strong relative z-10 w-full max-w-md p-8">
          <div className="flex items-center gap-3 rounded-2xl bg-accent/20 p-4">
            <Shield className="h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm text-foreground/80">
              Welcome, <strong>{email}</strong>. Create a password to secure
              your account.
            </p>
          </div>

          <div className="mt-6">
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/50">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/50">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {saving ? "Setting password..." : "Create password"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
