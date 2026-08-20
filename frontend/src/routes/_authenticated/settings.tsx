import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useSession, useSignOut } from "@/features/auth";
import { Database, LogOut, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · careerBloom" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { data: user } = useSession();
  const signOutFn = useSignOut();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function signOut() {
    await signOutFn();
    navigate({ to: "/auth", search: {} });
  }

  async function deleteAccount() {
    await signOutFn();
    navigate({ to: "/auth", search: {} });
  }

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
          Make it yours
        </p>
        <h1 className="mt-2 font-display text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-foreground/75">
          Your story matters. Tune the little things here.
        </p>
      </header>

      <section className="glass p-6 space-y-4">
        <h2 className="font-display text-2xl">Account</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Row label="Email" value={user?.email || "not provided"} />
        </div>
      </section>

      <section className="glass p-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/20">
            <Database className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-2xl">Database</h2>
            <p className="text-xs text-foreground/60">
              You're using the shared Neon database. Connect your own database
              to keep your data fully private.
            </p>
          </div>
        </div>
        <Link
          to="/connect-database"
          className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-5 py-2.5 text-sm text-accent-foreground hover:bg-accent/40"
        >
          <Database className="h-4 w-4" /> Change database
        </Link>
      </section>

      <section className="glass p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Sign out</h2>
          <p className="text-xs text-foreground/60">
            You can come back any time.
          </p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      <section className="glass border border-red-200/60 p-6 space-y-3">
        <h2 className="font-display text-2xl text-red-700/80">
          Delete account
        </h2>
        <p className="text-xs text-foreground/60">
          This clears your CV, edits, and cover letters. There's no undo. go
          softly.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200"
          >
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-full bg-white/70 px-4 py-2 text-sm"
            >
              Never mind
            </button>
            <button
              onClick={deleteAccount}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm text-white"
            >
              <Trash2 className="h-4 w-4" /> Yes, delete everything
            </button>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-foreground/55">
        {label}
      </p>
      <p className="mt-1 font-display text-lg break-all">{value}</p>
    </div>
  );
}
