import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { ArrowRight, Check, Database, Loader2, SkipForward } from "lucide-react";

export const Route = createFileRoute("/_authenticated/connect-database")({
  head: () => ({ meta: [{ title: "Connect Database · careerBloom" }] }),
  component: ConnectDatabasePage,
});

function ConnectDatabasePage() {
  const navigate = useNavigate();
  const [connString, setConnString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleConnect() {
    const val = connString.trim();

    if (!val) {
      setError("Paste your connection string first.");
      return;
    }
    if (!val.startsWith("postgresql://")) {
      setError("Enter a valid postgresql:// connection string.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await api("/auth/byodb", {
        method: "POST",
        json: {
          database_url: val,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/onboarding", replace: true }), 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connection failed. Check your connection string.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    try {
      await api("/auth/skip-byodb", { method: "POST" });
      navigate({ to: "/onboarding", replace: true });
    } catch {
      navigate({ to: "/onboarding", replace: true });
    }
  }

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
          Step 3 of 3
        </p>
        <h1 className="mt-2 font-display text-4xl">Bring Your Own Database</h1>
        <p className="mt-2 text-sm text-foreground/75">
          Your CVs, chats, and cover letters stay in <strong>your own</strong>{" "}
          Supabase project. No one else can read them.
        </p>
      </header>

      {success ? (
        <section className="glass p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl text-green-700">Connected!</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Your database is linked. Taking you to onboarding...
          </p>
        </section>
      ) : (
        <>
          <section className="glass p-6 space-y-6">
            <div>
              <h2 className="font-display text-lg mb-1">
                Create your database
              </h2>
              <ol className="ml-5 list-decimal space-y-1 text-sm text-foreground/70">
                <li>
                  Go to{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-2"
                  >
                    supabase.com
                  </a>
                </li>
                <li>Create Account (if you don't have one)</li>
                <li>Click "New Project"</li>
                <li>Name it: "CareerBloom" (or whatever)</li>
                <li>Choose a region close to you</li>
                <li>Create a strong database password</li>
                <li>
                  Once your project is ready, go to{" "}
                  <strong>Settings → Database</strong>
                </li>
                <li>
                  Copy the connection string that looks like:{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    postgresql://postgres:PASSWORD@xxxxx.supabase.co/postgres
                  </code>
                </li>
              </ol>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Paste it below 👇</p>
              <input
                value={connString}
                onChange={(e) => setConnString(e.target.value)}
                placeholder="postgresql://postgres:your_password@xxxxx.supabase.co/postgres"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm text-foreground/60 hover:text-foreground">
                Already have a Supabase project?
              </summary>
              <p className="mt-2 text-sm text-foreground/60">
                Just paste your connection string above and skip steps 1–8.
              </p>
            </details>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              onClick={handleConnect}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {saving ? "Connecting..." : "Validate & Connect"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>

          <section className="glass p-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg">Skip this step</h2>
              <p className="mt-1 text-xs text-foreground/60">
                You can always add your Supabase later in Settings. For now,
                your data stays on our server.
              </p>
            </div>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm text-foreground hover:bg-white disabled:opacity-50"
            >
              <SkipForward className="h-4 w-4" /> Skip
            </button>
          </section>
        </>
      )}
    </AppShell>
  );
}
