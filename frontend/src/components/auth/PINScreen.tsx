import { useState } from "react";
import { api, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Shield } from "lucide-react";

export function PINScreen({
  email,
  onDone,
}: {
  email: string;
  onDone: () => void;
}) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      const res = await api<{ access_token: string }>("/auth/password", {
        method: "POST",
        json: { email, password },
      });
      setTokens(res.access_token, "");
      await refreshUser();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/75">
        Welcome, <strong>{email}</strong>. Create a password to secure your
        account.
      </p>

      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/60">
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

      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-foreground/60">
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
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Shield className="h-4 w-4" />
        )}
        {saving ? "Setting password..." : "Create password"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
