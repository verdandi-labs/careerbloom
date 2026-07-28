import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { Suspense, lazy, useEffect } from "react";
import { z } from "zod";
import { useSession, useAuthUI } from "@/features/auth";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Loader2 } from "lucide-react";

const MagicLinkScreen = lazy(() =>
  import("@/features/auth/screens/MagicLinkScreen").then((m) => ({
    default: m.MagicLinkScreen,
  })),
);

const LoginScreen = lazy(() =>
  import("@/features/auth/screens/LoginScreen").then((m) => ({
    default: m.LoginScreen,
  })),
);

const BYODBScreen = lazy(() =>
  import("@/features/auth/screens/BYODBScreen").then((m) => ({
    default: m.BYODBScreen,
  })),
);

function LazyFallback() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
    </div>
  );
}

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
      <div className="relative min-h-screen">
        <div className="fixed-bg fixed-bg--auth" />
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    );
  }

  return <AuthPage />;
}

function AuthPage() {
  const { data: user } = useSession();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const mode = useAuthUI((s) => s.mode);
  const setMode = useAuthUI((s) => s.setMode);
  const authEmail = useAuthUI((s) => s.email);
  const setAuthEmail = useAuthUI((s) => s.setEmail);

  useEffect(() => {
    if (user && !search.step) navigate({ to: "/" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search.step]);

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
          <p className="mx-auto mt-4 max-w-sm text-[12px] leading-relaxed text-center text-foreground/60 md:text-sm">
            Enter your email and we will send you a secure
            <br />
            authentication link (valid for 15 minutes)
            <br />
            so you can set a password for your next login
          </p>
        </div>
        <section className="bg-secondary/30 rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6 md:p-8">
          <ErrorBoundary>
            <Suspense fallback={<LazyFallback />}>
              {mode === "magic-link" ? (
                <MagicLinkScreen
                  onSent={(email) => setAuthEmail(email)}
                  onSwitchToLogin={() => setMode("login")}
                />
              ) : (
                <LoginScreen
                  onSwitchToMagicLink={() => setMode("magic-link")}
                />
              )}
            </Suspense>
          </ErrorBoundary>
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
        <section className="bg-secondary/30 rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6">
          <ErrorBoundary>
            <Suspense fallback={<LazyFallback />}>
              <BYODBScreen email={authEmail} />
            </Suspense>
          </ErrorBoundary>
        </section>
        <Footer />
      </Background>
    );
  }

  return null;
}

function Background({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed-bg fixed-bg--auth" />
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-center text-xs tracking-wide text-green">
      Helping you grow into what's next
    </p>
  );
}
