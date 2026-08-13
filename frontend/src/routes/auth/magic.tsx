import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { api, errorMessage } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/magic")({
  ssr: false,
  validateSearch: z.object({
    token: z.string(),
    email: z.string(),
  }),
  component: MagicVerify,
});

function MagicVerify() {
  const { token, email } = Route.useSearch();
  const navigate = useNavigate();
  const called = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function verify() {
      try {
        const data = await api<{ onboarding: boolean }>(
          `/auth/magic?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
        );

        if (!data.onboarding) {
          navigate({ to: "/onboarding" });
          return;
        }

        navigate({ to: "/dashboard" });
      } catch (e) {
        setError(
          errorMessage(e, "Couldn't verify your link, it may have expired"),
        );
      }
    }

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-md p-8 text-center">
          <h1 className="font-display text-2xl">That link didn't work</h1>
          <p className="mt-2 text-sm text-foreground/75">{error}</p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm text-background"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
    </div>
  );
}
