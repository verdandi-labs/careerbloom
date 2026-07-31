import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { setTokens } from "@/lib/api";
import { verifyMagicLink } from "@/features/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/magic")({
  ssr: false,
  validateSearch: z.object({
    token: z.string().optional(),
    email: z.string().optional(),
  }),
  component: MagicPage,
});

function MagicPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/magic" });

  useEffect(() => {
    if (!search.token || !search.email) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    verifyMagicLink(search.token, search.email)
      .then(({ access_token, refresh_token }) => {
        setTokens(access_token, refresh_token);
        navigate({ to: "/", replace: true });
      })
      .catch(() => {
        navigate({ to: "/auth", replace: true });
      });
  }, [navigate, search.token, search.email]);

  return (
    <section className="bg-secondary/30 rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6 md:p-8 text-center">
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-accent" />
      <p className="text-foreground">Signing you in...</p>
    </section>
  );
}
