import { useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { api, errorMessage } from "@/lib/api";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";

export function MagicLinkScreen({
  onSent,
}: {
  onSent: (email: string) => void;
}) {
  const search = useSearch({ from: "/auth/mail" });
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email) {
      setError("Enter your email");
      return;
    }
    setError(null);
    setSending(true);

    try {
      await api("/auth/magic-link", { method: "POST", json: { email } });
      setSent(true);
    } catch (err) {
      setError(
        errorMessage(err, "Failed to send magic link, please try again"),
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/70">
          <Check className="h-6 w-6 text-foreground" />
        </div>
        <h2 className="font-display text-xl">Check your inbox</h2>
        <p className="mt-1 text-sm text-foreground">
          We sent a link to {email}. Click on the link to sign in.
        </p>
        <button
          onClick={() => onSent(email)}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-bold text-white"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-3 block w-full text-xs text-foreground underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {search.error === "email_exists" && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          An account with this email already exists. Please sign in with your
          original method
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-center text-sm font-bold text-white"
          >
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-xl shadow-sm bg-white/25 px-4 py-3 text-sm text-black/50 caret-[#444] outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {sending ? "Sending..." : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
