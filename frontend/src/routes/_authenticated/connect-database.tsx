import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { ArrowRight, Check, Database, Loader2, X } from "lucide-react";

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
    if (!val.startsWith("postgres://") && !val.startsWith("postgresql://")) {
      setError("Enter a valid postgresql:// or postgres:// connection string.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api("/tenant/connect", {
        method: "POST",
        json: { connection_string: val },
      });
      setSuccess(true);
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

  return (
    <AppShell>
      <header className="relative bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-foreground/60 transition hover:bg-white hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <h1 className="mt-2 font-display text-4xl">
          Want full control of your data?
        </h1>

        <p className="mt-2 text-sm text-foreground/75">
          By default CareerBloom stores your data securely. But, if you would
          prefer full control over where your data lives, we offer you the
          option to connect your own PostgreSQL database
        </p>

        <p className="mt-3 text-sm font-semibold text-foreground">
          Paste your connection string below and your data stays entirely in
          your hands
        </p>
      </header>

      {success ? (
        <section className="glass p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green/20">
            <Check className="h-8 w-8 text-green" />
          </div>
          <h2 className="font-display text-2xl text-green">Connected!</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Your database is linked. Your data is now stored privately.
          </p>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
          >
            Done
          </button>
        </section>
      ) : (
        <section className="glass p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg mb-1">Connection string</h2>
            <p className="text-xs text-foreground/60">
              Works with Supabase, Neon, Railway, Render, or any PostgreSQL
              provider.
            </p>
          </div>

          <input
            type="password"
            value={connString}
            onChange={(e) => setConnString(e.target.value)}
            placeholder="postgresql://user:password@host:5432/dbname"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-base outline-none focus:border-accent"
          />

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
      )}
    </AppShell>
  );
}
