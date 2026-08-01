import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/features/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      {
        title:
          "CareerBloom — Helping you translate experience into opportunity",
      },
      {
        name: "description",
        content:
          "CareerBloom is a gentle AI companion for people navigating career transitions.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { data: user, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null;

  return (
    <div className="relative min-h-screen">
      <div className="fixed-bg fixed-bg--app" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col items-center justify-start gap-10 px-6 pt-6 pb-16 text-center">
        <img
          src="/logo.png"
          alt="CareerBloom"
          className="relative z-0 h-28 w-auto -mb-8"
        />

        <div className="relative z-10 -mt-6 space-y-4">
          <h1 className="font-display text-[46px] leading-[1.04] md:text-[58px]">
            Helping you translate experience into opportunity
          </h1>
          <p className="text-[15px] text-foreground/70 leading-relaxed">
            Career transitions are exciting, but they can also challenge your
            confidence and make you lose sight of the value your previous
            experience holds
          </p>
          <p className="font-display text-2xl md:text-3xl text-foreground">
            You don't have to navigate this transition alone
          </p>
        </div>

        <div className="glass w-full space-y-4 -mt-6 px-6 py-6 text-left">
          <p className="text-sm text-foreground/80 leading-relaxed">
            CareerBloom was designed to reconnect you with your strengths, so
            you can share your experience with confidence and authenticity.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Think of it as a supportive framework that brings together
            structure, insight, and tools to reduce friction and make the
            process feel lighter.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            CareerBloom uses AI to support you through every stage: tailoring
            your CV, writing cover letters, optimizing your professional online
            presence, translating your documents into Spanish, and preparing for
            interviews.
          </p>
          <p className="font-display text-xl text-foreground leading-relaxed">
            We don't make you employable; we help you recognize that you already
            are.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate({ to: "/auth", search: {} })}
            className="flex-1 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition hover:bg-foreground/85"
          >
            Get started
          </button>
          <button
            onClick={() => navigate({ to: "/auth/login" })}
            className="flex-1 rounded-full bg-secondary/70 px-6 py-3.5 text-sm font-medium text-secondary-foreground backdrop-blur-sm transition hover:bg-secondary/90"
          >
            Welcome back
          </button>
        </div>

        <p className="font-display text-sm font-bold tracking-wide text-green">
          Helping you grow into what's next
        </p>
      </div>
    </div>
  );
}
