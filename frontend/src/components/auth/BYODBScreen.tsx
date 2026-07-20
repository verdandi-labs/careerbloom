import { useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Database,
  Loader2,
  SkipForward,
} from "lucide-react";

export function BYODBScreen({ email }: { email: string }) {
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
      await api("/auth/byodb", { method: "POST", json: { database_url: val } });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/onboarding", replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    try {
      await api("/auth/skip-byodb", { method: "POST" });
    } catch {
      /* skip anyway */
    }
    navigate({ to: "/onboarding", replace: true });
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="font-display text-2xl text-green-700">Connected!</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Taking you to onboarding...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/75">
        Connect your own Supabase database to keep your data private.
      </p>

      <input
        value={connString}
        onChange={(e) => setConnString(e.target.value)}
        placeholder="postgresql://postgres:password@xxxxx.supabase.co/postgres"
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
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
        {saving ? "Connecting..." : "Validate & Connect"}
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
