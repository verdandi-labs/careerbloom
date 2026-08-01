import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { api, setTokens } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/magic")({
  ssr: false,
  validateSearch: z.object({
    token: z.string(),
    email: z.string(),
    flow: z.enum(["new", "returning"]).optional().default("new"),
  }),
  component: MagicVerify,
});

function MagicVerify() {
  const { token, email, flow } = Route.useSearch();
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function verify() {
      try {
        const data = await api<{
          access_token: string;
          refresh_token: string;
          has_database_url: boolean;
          onboarding_complete: boolean;
        }>(
          `/auth/magic?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
        );

        setTokens(data.access_token, data.refresh_token);

        if (flow === "new" && !data.has_database_url) {
          navigate({ to: "/auth", search: { step: "byodb" } });
          return;
        }

        if (!data.onboarding_complete) {
          navigate({ to: "/onboarding" });
          return;
        }

        navigate({ to: "/dashboard" });
      } catch {
        navigate({ to: "/auth", search: {} });
      }
    }

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
    </div>
  );
}
