import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageCircleHeart,
  FileText,
  Mail,
  Settings,
  Upload,
  LogOut,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSignOut } from "@/features/auth";
import { CvUploadModal } from "./CvUploadModal";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageCircleHeart },
  { to: "/cv", label: "CV Builder", icon: FileText },
  { to: "/cover-letters", label: "Cover Letters", icon: Mail },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [uploadOpen, setUploadOpen] = useState(false);

  function handleSignOut() {
    signOut();
    navigate({ to: "/auth", search: {} });
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed-bg fixed-bg--app" />
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-5 p-4 md:p-6">
        <header className="flex items-center justify-between gap-4 rounded-[28px] bg-secondary/70 px-6 py-3 shadow-[0_18px_50px_-20px_rgba(248,175,166,0.8)] backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-2xl italic">Career</span>
            <span className="font-display text-2xl font-bold tracking-tight">
              BLOOM
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setUploadOpen(true)}
              className="hidden items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-wider text-background transition-transform hover:scale-[1.02] sm:flex"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload CV
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground font-display text-sm text-background ring-2 ring-white/60">
              M
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/60 text-foreground transition-colors hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col gap-5 pb-24 md:pb-0">
          {children}
        </main>
      </div>

      <nav className="glass-strong fixed inset-x-4 bottom-4 z-20 flex items-center justify-around p-2 md:hidden">
        {nav.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <CvUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
