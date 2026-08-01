import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Loader2 } from "lucide-react";

const MagicLinkScreenReturning = lazy(() =>
  import("@/features/auth/screens/MagicLinkScreenReturning").then((m) => ({
    default: m.MagicLinkScreenReturning,
  })),
);

export const Route = createFileRoute("/auth/login")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Welcome back · CareerBloom" }],
  }),
  component: WelcomeBack,
});

function WelcomeBack() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed-bg fixed-bg--auth" />
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="CareerBloom"
            className="mx-auto mb-6 h-10 w-auto"
          />
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Enter your email and we'll send you a secure link.
          </p>
        </div>
        <section className="bg-secondary/30 rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6 md:p-8">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
                </div>
              }
            >
              <MagicLinkScreenReturning />
            </Suspense>
          </ErrorBoundary>
        </section>
        <p className="font-display text-center text-xs tracking-wide text-green">
          Helping you grow into what's next
        </p>
      </div>
    </div>
  );
}
