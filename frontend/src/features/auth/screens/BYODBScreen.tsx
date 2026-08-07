import { useState } from "react";
import { api } from "@/lib/api";
import {
  ArrowRight,
  Check,
  Database,
  Loader2,
  Settings,
  ShieldAlert,
  SkipForward,
} from "lucide-react";

export function BYODBScreen() {
  const [connString, setConnString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  async function handleConnect() {
    const val = connString.trim();
    if (!val) {
      setError("Paste your connection string first");
      return;
    }
    if (!val.startsWith("postgresql")) {
      setError("Enter a valid postgresql:// connection string");
      return;
    }

    setError(null);
    setSaving(true);
    setChecking(true);
    try {
      await api("/tenant/connect", {
        method: "POST",
        json: { connection_string: val },
      });
      setChecking(false);
      setSuccess(true);
    } catch (err) {
      setChecking(false);
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    setConfirmSkip(true);
  }

  async function handleConfirmSkip() {
    setSaving(true);
    try {
      await api("/auth/skip-byodb", { method: "POST" });
    } catch {
      /* skip anyway */
    }
    setConfirmSkip(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-3">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green/20">
          <Check className="h-8 w-8 text-green" />
        </div>
        <h2 className="font-display text-2xl text-green">Connected!</h2>
        <p className="text-sm text-foreground">
          Your database is connected and ready.
        </p>
      </div>
    );
  }

  if (confirmSkip) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h3 className="font-display text-lg">Use the shared database?</h3>
          <p className="mt-2 text-sm text-foreground leading-relaxed">
            Your data will be stored in careerBloom's global database. You can
            connect your own database later in <strong>Settings</strong> to keep
            your data private.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleConfirmSkip}
            disabled={saving}
            className="flex-1 rounded-2xl bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground disabled:opacity-50"
          >
            {saving ? "Continuing..." : "Accept"}
          </button>
          <button
            onClick={() => setConfirmSkip(false)}
            disabled={saving}
            className="flex-1 rounded-2xl border border-border bg-white/70 px-5 py-3 text-sm text-foreground hover:bg-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-foreground">
          <Settings className="h-3.5 w-3.5" />
          Settings → Database to connect your own later
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Bring your own database</h2>
      <p className="text-sm text-foreground/70">
        Connect any PostgreSQL database to keep your data entirely under your
        control. Your CV, cover letters, and career data will be stored there —
        we never see it.
      </p>

      <label className="block text-sm font-medium text-foreground">
        Connection string
      </label>
      <input
        type="password"
        value={connString}
        onChange={(e) => setConnString(e.target.value)}
        placeholder="postgresql://user:password@host:5432/dbname"
        className="w-full rounded-xl bg-white/25 px-4 py-3 text-sm outline-none"
      />
      <p className="text-xs text-foreground/50">
        Works with Supabase, Neon, Railway, Render, or any PostgreSQL provider.
      </p>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        onClick={handleConnect}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        {checking
          ? "Verifying connection..."
          : saving
            ? "Connecting..."
            : "Validate & Connect"}
        <ArrowRight className="h-4 w-4" />
      </button>

      <button
        onClick={handleSkip}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm text-foreground hover:bg-white disabled:opacity-50"
      >
        <SkipForward className="h-4 w-4" /> Skip this step
      </button>
    </div>
  );
}
