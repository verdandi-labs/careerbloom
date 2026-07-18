import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Check,
  Copy,
  Loader2,
  ArrowRight,
  ExternalLink,
  Shield,
  Database,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/connect-database")({
  ssr: false,
  head: () => ({ meta: [{ title: "Connect Database · careerBloom" }] }),
  component: ConnectDatabasePage,
});

type Step = "form" | "validating" | "sql" | "done";

function ConnectDatabasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [schemaSql, setSchemaSql] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    const url = supabaseUrl.trim();
    const pw = dbPassword.trim();

    if (!url || !pw) {
      setError("Both fields are required.");
      return;
    }
    if (!/^https:\/\/[^.]+\.supabase\.co$/.test(url)) {
      setError("Enter a valid Supabase URL like https://xxxxx.supabase.co");
      return;
    }

    setError(null);
    setStep("validating");

    try {
      await api("/tenant/connect", {
        method: "POST",
        json: { supabase_url: url, db_password: pw },
      });

      const sqlResp = await api<{ sql: string }>("/tenant/schema-sql");
      setSchemaSql(sqlResp.sql);
      setStep("sql");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connection failed. Check your URL and password.",
      );
      setStep("form");
    }
  }

  async function handleDone() {
    setStep("done");
    setTimeout(() => {
      navigate({ to: "/onboarding", replace: true });
    }, 1500);
  }

  function copySql() {
    if (schemaSql) {
      navigator.clipboard.writeText(schemaSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/10" />

      <div className="relative z-10 w-full max-w-2xl">
        {step === "form" && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h1 className="font-display text-4xl">Bring Your Own Database</h1>
              <p className="mt-2 text-foreground/70">
                Your CVs, chats, and cover letters stay in{" "}
                <strong>your own</strong> Supabase project. No one else can read
                them.
              </p>
            </div>

            <div className="rounded-2xl border border-accent/20 bg-card p-6">
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-accent/5 p-4">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div className="text-sm text-foreground/70">
                  <strong className="text-foreground">Privacy first.</strong>{" "}
                  Personal data in your CV (name, email, phone) is automatically
                  redacted before storage using our Presidio-based censor — even
                  we can't see it.
                </div>
              </div>

              <h2 className="mb-1 font-display text-lg">
                Step 1: Create a Supabase project
              </h2>
              <p className="mb-4 text-sm text-foreground/60">
                Go to{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  supabase.com
                </a>
                , sign up, and create a new project. Then grab your credentials
                from <strong>Project Settings → Database</strong>.
              </p>

              <div className="mb-4">
                <label className="mb-1 block text-xs uppercase tracking-wider text-foreground/50">
                  Supabase Project URL
                </label>
                <input
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxxxx.supabase.co"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-xs uppercase tracking-wider text-foreground/50">
                  Database Password
                </label>
                <input
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="postgres role password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <p className="mt-1 text-xs text-foreground/50">
                  Found in Project Settings → Database → Database password
                </p>
              </div>

              {error && (
                <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                onClick={handleConnect}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Validate & Connect <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-border/50 bg-card/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Database className="h-4 w-4 text-accent" /> After connecting:
              </h3>
              <ol className="ml-5 list-decimal space-y-1 text-sm text-foreground/60">
                <li>
                  Run the SQL script we provide (copy-paste into Supabase SQL
                  Editor)
                </li>
                <li>
                  Enable "Email" auth in Supabase{" "}
                  <strong>Authentication → Providers</strong>
                </li>
                <li>
                  Add{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    careerbloom://callback
                  </code>{" "}
                  to <strong>Authentication → Settings → Redirect URLs</strong>
                </li>
                <li>Create your account and you're set</li>
              </ol>
            </div>
          </>
        )}

        {step === "validating" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent" />
            <p className="text-foreground/70">
              Validating connection and creating schema...
            </p>
          </div>
        )}

        {step === "sql" && schemaSql && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="font-display text-3xl">Connected!</h1>
              <p className="mt-2 text-foreground/70">
                Your database is linked. Now run this SQL in your Supabase SQL
                Editor.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-xs uppercase tracking-wider text-foreground/50">
                  Schema SQL
                </span>
                <button
                  onClick={copySql}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy SQL"}
                </button>
              </div>
              <pre className="max-h-80 overflow-auto p-4 text-xs text-foreground/80">
                <code>{schemaSql}</code>
              </pre>
            </div>

            <div className="mt-6 space-y-3">
              <a
                href="https://supabase.com/dashboard/project/_/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-accent/5"
              >
                Open Supabase SQL Editor <ExternalLink className="h-4 w-4" />
              </a>

              <button
                onClick={handleDone}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Done — Continue to Onboarding <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Check className="mb-4 h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">
              All set! Taking you to onboarding...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
