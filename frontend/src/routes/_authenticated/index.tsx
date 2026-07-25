import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOrCreateCareerDirection } from "@/lib/chat";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { useSession } from "@/features/auth";

const background = "/blossom.jpg";

import {
  ArrowUpRight,
  Sparkles,
  FileText,
  Mail,
  Globe2,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "careerBloom — Your AI Career Companion" },
      {
        name: "description",
        content: "AI-powered CV and career transition companion.",
      },
    ],
  }),
  component: Dashboard,
});

const coverLetters = [
  { title: "Product Designer", company: "Figma", date: "Jun 18" },
  { title: "UX Researcher", company: "Notion", date: "Jun 12" },
  { title: "Brand Strategist", company: "Aesop", date: "May 30" },
];

function Dashboard() {
  const navigate = useNavigate();
  const { data: user } = useSession();
  const [checked, setChecked] = useState(false);
  const [displayName, setDisplayName] = useState("there");

  useEffect(() => {
    if (!user) return;
    if (!user.onboarding_complete) {
      navigate({ to: "/onboarding" });
      return;
    }
    setDisplayName(user.display_name || "there");
    setChecked(true);
  }, [user, navigate]);

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/60" />
      </div>
    );
  }

  return (
    <AppShell>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
        <article
          className="glass relative overflow-hidden p-7 lg:col-span-8 lg:row-span-2 min-h-[420px]"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.70), rgba(250,220,217,0.70)), url(${background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">
            Monday · June 22
          </p>
          <h1 className="mt-3 max-w-lg font-display text-[44px] leading-[1.02] md:text-[56px]">
            Welcome back, {displayName}.{" "}
            <span className="italic">Let's keep</span>{" "}
            <span className="font-bold">blooming</span>.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/70 md:text-base">
            Your story is taking shape beautifully. A few small touches today
            and your next chapter is ready to share.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background"
            >
              <Sparkles className="h-4 w-4" /> Talk to your coach
            </Link>
            <Link
              to="/cv"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm text-secondary-foreground"
            >
              Open CV Builder <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        <article className="bg-secondary/70 backdrop-blur-md flex flex-col p-6 rounded-[20px] shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] lg:col-span-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl">Your CV</h2>
              <p className="mt-0.5 text-xs text-foreground/70">
                A living document
              </p>
            </div>
            <FileText className="h-5 w-5 text-foreground/70" />
          </div>

          <div className="mt-5 flex items-end justify-between">
            <span className="font-display text-5xl leading-none">
              72<span className="text-xl text-foreground/50">%</span>
            </span>
            <div className="flex items-center gap-1 rounded-full bg-white/60 p-1 text-[10px]">
              <button className="rounded-full bg-foreground px-2.5 py-1 text-background">
                <Globe2 className="mr-1 inline h-3 w-3" />
                EN
              </button>
              <button className="px-2.5 py-1 text-foreground/60">ES</button>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: "72%" }}
            />
          </div>
          <p className="mt-2 text-[11px] text-foreground/60">
            Last edited yesterday
          </p>

          <Link
            to="/cv"
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-medium text-background"
          >
            Open CV Builder <ArrowUpRight className="h-4 w-4" />
          </Link>
        </article>

        <article className="glass flex flex-col p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-foreground/70" />
              <h2 className="font-display text-2xl">Cover Letters</h2>
            </div>
            <span className="rounded-full bg-secondary/40 px-2.5 py-0.5 text-[11px]">
              {coverLetters.length}
            </span>
          </div>

          <ul className="mt-4 flex-1 divide-y divide-white/40">
            {coverLetters.map((l) => (
              <li
                key={l.title}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="truncate text-[11px] text-foreground/55">
                    {l.company}
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-[11px] text-foreground/50">
                  {l.date}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to="/cover-letters"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-sm font-medium text-secondary-foreground"
          >
            <Mail className="h-4 w-4" /> New cover letter
          </Link>
        </article>

        <button
          type="button"
          onClick={async () => {
            const id = await getOrCreateCareerDirection();
            if (id)
              navigate({
                to: "/chat/$conversationId",
                params: { conversationId: id },
              });
          }}
          className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-white/40 bg-white/30 p-6 text-left backdrop-blur-xl shadow-[0_16px_40px_-18px_rgba(248,175,166,0.6)] transition hover:bg-white/40 lg:col-span-8 min-h-[200px]"
        >
          <div className="flex items-start justify-between text-xs">
            <div className="grid h-8 w-8 place-items-center rounded-full border border-foreground/30">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div>
            <h3 className="font-display text-3xl leading-tight">
              You are on your way
            </h3>
            <p className="mt-2 text-sm text-foreground/70">
              Small steps towards achieving your goals
            </p>
          </div>
        </button>
      </section>
    </AppShell>
  );
}
