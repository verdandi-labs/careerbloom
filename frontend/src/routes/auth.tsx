import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { MagicLinkScreen } from "@/components/auth/MagicLinkScreen";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { BYODBScreen } from "@/components/auth/BYODBScreen";

const background = "/blossom.jpg";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Welcome to CareerBloom!" },
      {
        name: "description",
        content:
          "Ready for your next career move? Enter your email and we'll send you a secure authentication link",
      },
    ],
  }),
  validateSearch: z.object({
    step: z.string().optional(),
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
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.70), rgba(250,220,217,0.70)), url(${background})`,
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
  const [mode, setMode] = useState<"magic-link" | "login">("magic-link");

  useEffect(() => {
    if (user && !search.step) navigate({ to: "/" });
  }, [user, search.step, navigate]);

  if (!user) {
    return (
      <Background>
        <div className="text-center">
          <img
            src="/logo.png"
            alt="careerBloom"
            className="mx-auto mb-6 h-10 w-auto"
          />
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            Welcome to CareerBloom!
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Ready for the next step in your career?
          </p>
          <p className="mx-auto mt-4 max-w-sm text-[10px] leading-relaxed text-center text-foreground/70 md:text-xs">
            Enter your email and we will send you a secure
            <br />
            authentication link (valid for 15 minutes)
            <br />
            so you can set a password for your next login
          </p>
        </div>
        <section className="bg-secondary/50 backdrop-blur-md rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6 md:p-8">
          {mode === "magic-link" ? (
            <MagicLinkScreen
              onSent={(email) => setAuthEmail(email)}
              onSwitchToLogin={() => setMode("login")}
            />
          ) : (
            <LoginScreen onSwitchToMagicLink={() => setMode("magic-link")} />
          )}
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
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground">
            Step 2 of 2
          </p>
          <h1 className="mt-1 font-display text-3xl">
            Bring your own database
          </h1>
          <p className="mt-1 text-sm text-foreground">
            Optional: connect your own Supabase to keep data private.
          </p>
        </header>
        <section className="bg-secondary/50 backdrop-blur-md rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6">
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
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.70), rgba(250,220,217,0.70)), url(${background})`,
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
    <p className="text-center text-xs tracking-wide text-[#4A8033]">
      Helping you grow into what's next
    </p>
  );
}
