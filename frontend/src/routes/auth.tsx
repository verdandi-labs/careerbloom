import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, setTokens } from "@/lib/api";
import blossomAsset from "@/assets/blossom.jpg.asset.json";
import {
  ArrowRight,
  Check,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

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
  component: AuthPage,
});

const magicPerks = [
  { icon: ShieldCheck, label: "No password to leak or forget" },
  { icon: Timer, label: "Link expires in 15 minutes" },
  { icon: Sparkles, label: "One tap and you're blooming" },
];

const passwordPerks = [
  { icon: ShieldCheck, label: "Secure account with your password" },
  { icon: Timer, label: "Quick sign-in anytime" },
  { icon: Sparkles, label: "Full access to your career tools" },
];

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

  const perks = mode === "magic" ? magicPerks : passwordPerks;

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
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <section className="grid w-full grid-cols-1 gap-5 lg:grid-cols-12">
          <article
            className="glass relative flex min-h-[480px] flex-col justify-between overflow-hidden p-8 lg:col-span-7"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.72), rgba(250,220,217,0.68)), url(${blossomAsset.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <img src="/logo.png" alt="careerBloom" className="h-9 w-auto" />

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">
                Welcome back
              </p>
              <h1 className="mt-3 max-w-md font-display text-[44px] leading-[1.02] md:text-[52px]">
                Sign in to your <span className="italic">career companion</span>
                .
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/70 md:text-base">
                {mode === "magic"
                  ? "No passwords to remember. Enter your email and we'll send a magic link straight to your inbox — secure and fast."
                  : "Enter your email and password to access your CVs, chats, and cover letters."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {perks.map((perk) => (
                <span
                  key={perk.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[11px] text-foreground/70"
                >
                  <perk.icon className="h-3.5 w-3.5" />
                  {perk.label}
                </span>
              ))}
            </div>
          </article>

          <article className="bg-secondary/70 flex flex-col rounded-[20px] p-6 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] backdrop-blur-md lg:col-span-5">
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
              <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60">
                  <Check className="h-8 w-8 text-foreground" />
                </div>
                <h2 className="font-display text-2xl">Check your email</h2>
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
              <div className="mt-6 flex flex-1 flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/60">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="auth-input"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={sendMagicLink}
                  disabled={sending}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50"
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
              <div className="mt-6 flex flex-1 flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/60">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="auth-input"
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
                      className="auth-input"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={loginWithPassword}
                  disabled={sending}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50"
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
          </article>
        </section>
      </div>
    </div>
  );
}
