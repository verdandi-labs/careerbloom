import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Check, Loader2, Shield } from "lucide-react";

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
        () =>
          navigate({
            to: "/auth",
            search: { step: "byodb" },
            replace: true,
          }),
        1500,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {step === "verifying" && (
        <section className="bg-secondary/70 backdrop-blur-md rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-accent" />
          <p className="text-foreground">Verifying your link...</p>
        </section>
      )}

      {step === "done" && (
        <section className="bg-secondary/70 backdrop-blur-md rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl text-green-700">
            Password set!
          </h2>
          <p className="mt-1 text-sm text-foreground">
            Taking you to the next step...
          </p>
        </section>
      )}

      {step === "form" && (
        <>
          <header className="rounded-[20px] bg-secondary/70 px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground">
              Step 2 of 3
            </p>
            <h1 className="mt-2 font-display text-4xl">Set your password</h1>
            <p className="mt-1 text-sm text-foreground">
              Welcome, <strong>{email}</strong>. Create a password to secure
              your account.
            </p>
          </header>

          <section className="bg-secondary/70 backdrop-blur-md rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg bg-[#FFE3EA]/50 px-4 py-2.5 text-sm outline-none backdrop-blur-md focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-lg bg-[#FFE3EA]/50 px-4 py-2.5 text-sm outline-none backdrop-blur-md focus:border-accent"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {saving ? "Setting password..." : "Create password"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </>
      )}
    </>
  );
}
