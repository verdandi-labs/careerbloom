import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { MagicLinkScreen } from "@/components/auth/MagicLinkScreen";
import { BYODBScreen } from "@/components/auth/BYODBScreen";
import blossomAsset from "@/assets/blossom.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · careerBloom" },
      {
        name: "description",
        content: "Sign in to careerBloom and keep blooming.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    step: (search.step as string) || undefined,
  }),
  component: AuthLayout,
});

function AuthLayout() {
  const location = useRouterState({ select: (s) => s.location });
  const isChildRoute = location.pathname !== "/auth";

  if (isChildRoute) {
    return (
      <div
        className="relative min-h-screen"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(249,241,240,0.4), rgba(250,220,217,0.6)), url(${blossomAsset.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    );
  }

  return <AuthPage />;
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [authEmail, setAuthEmail] = useState("");

  useEffect(() => {
    if (user && !search.step) navigate({ to: "/" });
  }, [user, search.step, navigate]);

  if (!user) {
    return (
      <Background>
        <header className="rounded-[20px] bg-secondary/70 px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] backdrop-blur-md">
          <img src="/logo.png" alt="careerBloom" className="mb-3 h-8 w-auto" />
          <h1 className="mt-1 font-display text-3xl">Sign in to careerBloom</h1>
          <p className="mt-1 text-sm text-foreground/75">
            No password needed. Drop your email and we'll send a magic link.
          </p>
        </header>
        <section className="glass p-6">
          <MagicLinkScreen
            onSent={(email) => {
              setAuthEmail(email);
            }}
          />
        </section>
        <Footer />
      </Background>
    );
  }

  if (search.step === "byodb") {
    return (
      <Background>
        <header className="rounded-[20px] bg-secondary/70 px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] backdrop-blur-md">
          <img src="/logo.png" alt="careerBloom" className="mb-3 h-8 w-auto" />
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
            Step 2 of 2
          </p>
          <h1 className="mt-1 font-display text-3xl">
            Bring your own database
          </h1>
          <p className="mt-1 text-sm text-foreground/75">
            Optional: connect your own Supabase to keep data private.
          </p>
        </header>
        <section className="glass p-6">
          <BYODBScreen email={authEmail} />
        </section>
        <Footer />
      </Background>
    );
  }

  return null;
}

function Background({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(249,241,240,0.4), rgba(250,220,217,0.6)), url(${blossomAsset.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-center text-[11px] uppercase tracking-[0.22em] text-foreground/50">
      careerBloom — keep blooming.
    </p>
  );
}
