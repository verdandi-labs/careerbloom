import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setTokens, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
  const { refreshUser } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      refreshUser().then(async () => {
        const connected = await hasTenant();
        if (connected) {
          navigate({ to: "/onboarding", replace: true });
        } else {
          navigate({ to: "/connect-database", replace: true });
        }
      });
    } else {
      navigate({ to: "/auth", replace: true });
    }
  }, [navigate, refreshUser]);

  return (
    <div className="grid min-h-screen place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-foreground/60" />
    </div>
  );
}
