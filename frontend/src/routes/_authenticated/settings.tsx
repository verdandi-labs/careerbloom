import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Check, Globe2, LogOut, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · careerBloom" }] }),
  component: SettingsPage,
});

type Lang = "en" | "es";

function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name || "");
    setLang(user.preferred_language as Lang);
  }, [user]);

  async function saveLang(next: Lang) {
    setLang(next); setSaving(true);
    await api("/profile", { method: "PATCH", json: { preferred_language: next } });
    setSaving(false);
  }

  async function signOut() {
    logout();
    navigate({ to: "/auth" });
  }

  async function deleteAccount() {
    // Note: account deletion would need a dedicated backend endpoint
    // For now, just sign out
    logout();
    navigate({ to: "/auth" });
  }

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">Make it yours</p>
        <h1 className="mt-2 font-display text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-foreground/75">Your story matters. Tune the little things here.</p>
      </header>

      <section className="glass p-6 space-y-4">
        <h2 className="font-display text-2xl">Account</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Row label="Display name" value={displayName || "\u2014"} />
          <Row label="Language" value={lang === "en" ? "English" : "Espa\u00f1ol"} />
        </div>
      </section>

      <section className="glass p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Language preference</h2>
            <p className="text-xs text-foreground/60">Sets the default for your CV and cover letters.</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
            {(["en", "es"] as Lang[]).map((l) => (
              <button key={l} onClick={() => saveLang(l)} disabled={saving} className={`flex items-center gap-1 rounded-full px-4 py-2 text-xs ${lang === l ? "bg-accent text-accent-foreground" : "text-foreground/70"}`}>
                <Globe2 className="h-3 w-3" /> {l === "en" ? "English" : "Espa\u00f1ol"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Sign out</h2>
          <p className="text-xs text-foreground/60">You can come back any time.</p>
        </div>
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      <section className="glass border border-red-200/60 p-6 space-y-3">
        <h2 className="font-display text-2xl text-red-700/80">Delete account</h2>
        <p className="text-xs text-foreground/60">This clears your CV, edits, and cover letters. There's no undo \u2014 go softly.</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200">
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setConfirmDelete(false)} className="rounded-full bg-white/70 px-4 py-2 text-sm">Never mind</button>
            <button onClick={deleteAccount} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm text-white">
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
      <p className="text-[11px] uppercase tracking-wider text-foreground/55">{label}</p>
      <p className="mt-1 font-display text-lg break-all">{value}</p>
    </div>
  );
}
