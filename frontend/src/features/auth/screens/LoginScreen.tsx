import { useState } from "react";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import { useLogin } from "../hooks";

const STORAGE_KEY = "auth_email";

export function LoginScreen({
  onSwitchToMagicLink,
}: {
  onSwitchToMagicLink: () => void;
}) {
  const [email, setEmail] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "",
  );
  const [remember, setRemember] = useState(
    () => !!localStorage.getItem(STORAGE_KEY),
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password");
      return;
    }
    setError(null);

    if (remember) {
      localStorage.setItem(STORAGE_KEY, email);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    login.mutate(
      { email, password },
      {
        onError: (err) =>
          setError(
            err instanceof Error ? err.message : "Invalid email or password",
          ),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-center text-sm font-bold text-white"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="you@example.com"
          className="w-full rounded-xl shadow-sm bg-white/25 px-4 py-3 text-sm text-black/50 caret-accent outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>
      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-center text-sm font-bold text-white"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Enter your password"
          className="w-full rounded-xl shadow-sm bg-white/25 px-4 py-3 text-sm text-black/50 caret-accent outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 text-[15px] text-black/40">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border-white/30 bg-white/25 accent-[var(--color-secondary)] focus:ring-[var(--color-secondary)]/30"
        />
        Remember me
      </label>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {login.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {login.isPending ? "Logging in..." : "Log in"}
      </button>

      <button
        type="button"
        onClick={onSwitchToMagicLink}
        className="flex w-full items-center justify-center gap-1.5 text-center text-[15px] text-black/40 underline underline-offset-2"
      >
        <ArrowLeft className="h-3 w-3" />
        Back
      </button>
    </form>
  );
}
