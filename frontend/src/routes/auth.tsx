import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, setTokens } from "@/lib/api";
import blossomAsset from "@/assets/blossom.jpg.asset.json";
import { ArrowRight, KeyRound, Loader2, Mail } from "lucide-react";

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

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendMagicLink() {
    if (!email) {
      setError("Enter your email.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await api("/auth/magic-link", { method: "POST", json: { email } });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send magic link.",
      );
    } finally {
      setSending(false);
    }
  }

  async function loginWithPassword() {
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await api<{ access_token: string; email: string }>(
        "/auth/login",
        {
          method: "POST",
          json: { email, password },
        },
      );
      setTokens(res.access_token, "");
      localStorage.setItem("auth_email", res.email);
      window.location.href = "/";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password.",
      );
    } finally {
      setSending(false);
    }
  }

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
            Welcome back
          </p>
          <h1 className="mt-1 font-display text-3xl">
            {mode === "magic" ? "Check your inbox" : "Welcome to careerBloom"}
          </h1>
          <p className="mt-1 text-sm text-foreground/75">
            {mode === "magic"
              ? "No password needed. Drop your email and we'll send a magic link."
              : "Sign in with your email and password."}
          </p>
        </header>

        <section className="glass p-6">
          <div className="flex gap-1 rounded-full bg-white/70 p-1 text-xs">
            <button
              onClick={() => {
                setMode("magic");
                setError(null);
              }}
              className={`flex-1 rounded-full py-2 text-center font-medium transition ${
                mode === "magic"
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Magic Link
            </button>
            <button
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className={`flex-1 rounded-full py-2 text-center font-medium transition ${
                mode === "password"
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Password
            </button>
          </div>

          {sent ? (
            <div className="mt-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60">
                <Mail className="h-8 w-8 text-foreground" />
              </div>
              <h2 className="font-display text-xl">Check your email</h2>
              <p className="mt-1 text-sm text-foreground/75">
                We sent a magic link to <strong>{email}</strong>. Click it to
                sign in.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="mt-5 text-xs text-foreground/60 underline underline-offset-2 hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          ) : mode === "magic" ? (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <button
                onClick={sendMagicLink}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {sending ? "Sending..." : "Send magic link"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/60">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <button
                onClick={loginWithPassword}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {sending ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <p className="text-center text-[11px] uppercase tracking-[0.22em] text-foreground/50">
          careerBloom — keep blooming.
        </p>
      </div>
    </div>
  );
}
