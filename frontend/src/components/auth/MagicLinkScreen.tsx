import { useState } from "react";
import { api } from "@/lib/api";
import {
  ArrowRight,
  Loader2,
  Mail,
  Check,
  ShieldCheck,
  Timer,
  Sparkles,
} from "lucide-react";

const perks = [
  { icon: ShieldCheck, label: "No password to leak or forget" },
  { icon: Timer, label: "Link expires in 15 minutes" },
  { icon: Sparkles, label: "One tap and you're blooming" },
];

export function MagicLinkScreen({
  onSent,
}: {
  onSent: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
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

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60">
          <Check className="h-8 w-8 text-foreground" />
        </div>
        <h2 className="font-display text-xl">Check your inbox</h2>
        <p className="mt-1 text-sm text-foreground/75">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
        <button
          onClick={() => onSent(email)}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-medium text-background"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-3 block w-full text-xs text-foreground/60 underline underline-offset-2 hover:text-foreground"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
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

      <div className="flex flex-wrap gap-2 pt-2">
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
    </div>
  );
}
