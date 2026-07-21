import { useState } from "react";
import { api, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";

export function LoginScreen({
  onSwitchToMagicLink,
}: {
  onSwitchToMagicLink: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  async function handleSubmit() {
    if (!email || !password) {
      setError("Enter your email and password");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api<{
        access_token: string;
      }>("/auth/login", { method: "POST", json: { email, password } });
      setTokens(res.access_token, "");
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-center text-sm font-medium text-foreground">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm outline-none backdrop-blur-lg transition focus:border-accent focus:ring-1 focus:ring-accent/30"
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !password &&
            (e.target as HTMLInputElement).form
              ?.querySelector<HTMLInputElement>("[name=password]")
              ?.focus()
          }
        />
      </div>
      <div>
        <label className="mb-1.5 block text-center text-sm font-medium text-foreground">
          Password
        </label>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm outline-none backdrop-blur-lg transition focus:border-accent focus:ring-1 focus:ring-accent/30"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {loading ? "Logging in..." : "Log in"}
      </button>

      <button
        onClick={onSwitchToMagicLink}
        className="flex w-full items-center justify-center gap-1.5 text-center text-xs text-foreground underline underline-offset-2"
      >
        <ArrowLeft className="h-3 w-3" />
        Send me a magic link instead
      </button>
    </div>
  );
}
