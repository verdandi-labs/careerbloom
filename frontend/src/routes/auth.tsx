import {
  Outlet,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";
import { z } from "zod";
import { API_BASE } from "@/lib/api";
import { Chrome, Github } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Login · CareerBloom" }],
  }),
  validateSearch: z.object({ error: z.string().optional() }),
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

  return <LoginPage />;
}

const ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: "Something went wrong, please try again",
  email_exists: "This email is already registered with a different provider",
};

function LoginPage() {
  const { error } = Route.useSearch();
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <Background>
      <div className="text-center">
        <img
          src="/logo.png"
          alt="careerBloom"
          className="mx-auto mb-6 h-10 w-auto"
        />
        <h1 className="font-display text-4xl leading-tight md:text-5xl">
          Login / Sign up
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Ready for the next step in your career?
        </p>
      </div>
      <section className="bg-secondary/30 rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] p-6 md:p-8">
        {errorMessage && (
          <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <div className="flex w-full flex-col gap-3">
          <a
            href={`${API_BASE}/auth/oauth/google`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background transition hover:bg-foreground/85"
          >
            <Chrome className="h-4 w-4" />
            Google
          </a>
          <a
            href={`${API_BASE}/auth/oauth/github`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary/70 px-6 py-3.5 text-sm font-bold text-secondary-foreground backdrop-blur-sm transition hover:bg-secondary/90"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </section>
      <Footer />
    </Background>
  );
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
    <p className="font-display text-center text-xs tracking-wide text-green">
      Helping you grow into what's next
    </p>
  );
}
