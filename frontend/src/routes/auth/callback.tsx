import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setTokens, api } from "@/lib/api";
import { useAuthStore } from "@/features/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallback,
});

async function hasTenant(): Promise<boolean> {
  try {
    const resp = await api<{ connected: boolean }>("/tenant/status");
    return resp.connected;
  } catch {
    return false;
  }
}

function AuthCallback() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      login(accessToken, refreshToken).then(async () => {
        const connected = await hasTenant();
        if (connected) {
          navigate({ to: "/onboarding", replace: true });
        } else {
          navigate({ to: "/connect-database", replace: true });
        }
      });
    } else {
      navigate({ to: "/auth", search: {}, replace: true });
    }
  }, [navigate, login]);

  return (
    <section className="glass p-8 text-center">
      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-accent" />
      <p className="text-foreground/70">Signing you in...</p>
    </section>
  );
}
