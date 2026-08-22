import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/features/auth";
import { API_BASE } from "@/lib/api";
import { Chrome, Github } from "lucide-react";

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

const STAGES = [
  {
    title: "CV Tailoring",
    desc: "AI helps you shape your CV around the career you're moving towards, translating your existing experience into a new context",
  },
  {
    title: "Cover Letters",
    desc: "Write personalised cover letters with AI, tailored to each application and true to your voice",
  },
  {
    title: "Online Presence",
    desc: "Ideas and support to help you build a professional presence that reflects where you're going",
  },
  {
    title: "Document Translation",
    desc: "Translate your CV or cover letter into any language, instantly",
  },
  {
    title: "Interview Prep",
    desc: "Practice for interviews, get honest feedback, and build the confidence to show up prepared",
    incoming: true,
  },
  {
    title: "Job Match",
    desc: "Paste a job offer and get an honest read on how well it fits your profile, skills, and career direction",
    incoming: true,
  },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.png"
        alt="CareerBloom logo"
        className="h-8 w-8 object-contain"
      />
      <span
        className={`font-playfair text-base font-semibold tracking-tight ${light ? "text-[#fee8e7]" : "text-[#1c1410]"}`}
      >
        Career<span className="text-secondary">Bloom</span>
      </span>
    </div>
  );
}

function LandingPage() {
  const { data: user, isLoading } = useSession();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) return null;

  return (
    <div className="bg-[#fee8e7]">
      {/* Sticky nav */}
      <header
        className="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(60,45,42,0.18)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        }}
      >
        <div className="flex items-center justify-between px-6 py-2">
          <Logo light={scrolled} />
          <nav className="hidden items-center gap-2 md:flex">
            {[
              { label: "Home", href: "#", solid: false },
              { label: "Philosophy", href: "#philosophy", solid: false },
              { label: "How it works", href: "#how", solid: false },
              { label: "Get started", href: "#join", solid: true },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="rounded-full border border-[#c97b70] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
              >
                {label}
              </a>
            ))}
          </nav>
          <button
            className="text-[#F8AFA6] md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="ml-auto mr-4 mb-3 flex w-1/2 flex-col items-end gap-1 rounded-3xl border border-white/40 bg-[#120a08]/20 p-3 backdrop-blur-2xl md:hidden">
            {[
              { label: "Home", href: "#", sage: false },
              { label: "Philosophy", href: "#philosophy", sage: false },
              { label: "How it works", href: "#how", sage: false },
              { label: "Get started", href: "#join", sage: true },
            ].map(({ label, href, sage }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`group relative rounded-full px-4 py-2.5 text-sm font-medium transition-colors hover:text-[#F8AFA6] ${
                  sage ? "text-primary" : "text-white"
                }`}
              >
                {label}
                <span className="absolute right-4 bottom-1.5 left-4 h-px origin-right scale-x-0 bg-sage transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section
        className="relative flex min-h-screen flex-col"
        style={{ backgroundColor: "#120a08" }}
      >
        <div className="absolute inset-0">
          <img
            src="/blossom.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(18,10,8,0.3) 0%, rgba(18,10,8,0.45) 60%, #120a08 100%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-24 pb-20 text-center">
          <img
            src="/logo.png"
            alt="CareerBloom"
            className="h-24 w-24 object-contain"
          />

          <div className="flex flex-1 flex-col items-center justify-center">
            <h1 className="font-playfair max-w-3xl text-4xl leading-tight font-bold text-white md:text-5xl">
              Helping you translate{" "}
              <em className="not-italic text-[#F8AFA6]">experience</em> into
              opportunity
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-relaxed text-white md:text-base">
              Career transitions are exciting, but they can also challenge your
              confidence and make you lose sight of the value your previous
              experience holds
            </p>

            <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row">
              <a
                href="#join"
                className="rounded-full bg-sage px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
              >
                Start your journey
              </a>
              <a
                href="#philosophy"
                className="rounded-full border border-[#3a2a26] px-7 py-3.5 text-sm font-medium text-[#b89f99] transition-colors"
              >
                Learn more ↓
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-center pb-8 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 8l5 5 5-5"
              stroke="#6b4f47"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* You don't have to navigate alone */}
      <section id="philosophy" className="bg-[#fee8e7] px-6 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <article className="flex flex-col rounded-[20px] bg-secondary/70 p-6 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)] backdrop-blur-md">
              <p className="mb-3 text-xs font-semibold tracking-widest text-white/80 uppercase">
                Every stage, covered
              </p>
              <p className="font-playfair text-2xl leading-tight text-[#1c1410]">
                Five AI tools, one gentle companion
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["CV Tailoring", "Cover Letters", "Interview Prep"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-full bg-white/50 px-3 py-1 text-xs font-medium text-[#1c1410]"
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>
            </article>
            <article className="glass p-6">
              <p className="font-playfair text-sm leading-relaxed italic text-[#1c1410]">
                "Think of it as a supportive framework that brings together
                structure, insight, and tools to reduce friction."
              </p>
            </article>
          </div>

          <div>
            <p className="mb-5 text-xs tracking-widest text-[#F8AFA6] uppercase">
              Our promise
            </p>
            <h2 className="font-playfair mb-8 text-4xl leading-tight font-bold text-[#1c1410] md:text-5xl">
              You don't have to navigate this transition alone
            </h2>
            <p className="mb-5 text-base leading-relaxed text-[#111]">
              CareerBloom was designed to reconnect you with your strengths, so
              you can share your experience with confidence and authenticity.
            </p>
            <p className="mb-5 text-base leading-relaxed text-[#111]">
              Think of it as a supportive framework that brings together
              structure, insight, and tools to reduce friction and make the
              process feel lighter.
            </p>
            <p className="font-playfair text-xl leading-relaxed text-[#1c1410]">
              We don't make you employable; we help you recognize that you
              already are.
            </p>

            {/* Feature cards */}
            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {STAGES.slice(0, 3).map((s) => (
                <div key={s.title} className="glass p-5">
                  <p className="font-playfair text-lg font-semibold text-[#1c1410]">
                    {s.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/70">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI stages */}
      <section id="how" className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0">
          <img
            src="/back2.jpg"
            alt=""
            className="h-full w-full scale-105 object-cover blur-md"
          />
          <div className="absolute inset-0 bg-[#fee8e7]/55" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 text-xs tracking-widest text-[#e89d94] uppercase">
                Every stage, covered
              </p>
              <h2 className="font-playfair max-w-lg text-2xl leading-tight font-bold text-[#1c1410] md:text-3xl">
                Think of it as a supportive framework that brings together
                structure, insight, and tools to reduce friction
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {" "}
            {STAGES.map((s) => (
              <article
                key={s.title}
                className={`glass-strong relative p-6 ${s.incoming ? "opacity-70" : ""}`}
              >
                {s.incoming && (
                  <span className="absolute top-4 right-4 rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-medium text-[#1c1410] uppercase tracking-wide">
                    Coming soon
                  </span>
                )}
                <p className="font-playfair text-xl font-semibold text-[#F8AFA6]">
                  {s.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#4a403c]">
                  {s.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Join / Auth */}
      <section id="join" className="relative overflow-hidden bg-[#1a0f0c]">
        <div className="absolute top-0 right-0 bottom-0 hidden w-72 opacity-20 lg:block">
          <img
            src="/blossom.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, #1a0f0c, transparent)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mb-10 inline-block rounded-full border border-[#3a2a26] bg-[#2a1a15] px-4 py-2 text-xs tracking-widest text-[#F8AFA6] uppercase">
            Ready when you are
          </div>

          <h2 className="font-playfair mb-6 text-4xl leading-tight font-bold text-white md:text-5xl">
            We don't make you employable.
            <br />
            <em className="not-italic text-[#F8AFA6]">We help you recognize</em>
            <br />
            that you already are.
          </h2>

          <div className="mx-auto flex max-w-sm flex-col gap-3">
            <a
              href={`${API_BASE}/auth/oauth/google`}
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#3a2a26] bg-[#2a1a15] px-5 py-3.5 text-sm font-medium text-[#fee8e7] transition-colors hover:bg-[#3a2a26]"
            >
              <Chrome className="h-4 w-4" />
              Continue with Google
            </a>
            <a
              href={`${API_BASE}/auth/oauth/github`}
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#3a2a26] bg-[#2a1a15] px-5 py-3.5 text-sm font-medium text-[#fee8e7] transition-colors hover:bg-[#3a2a26]"
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </a>

            <div className="my-1 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#3a2a26]" />
              <span className="text-xs text-[#6b4f47]">or</span>
              <div className="h-px flex-1 bg-[#3a2a26]" />
            </div>

            <button
              onClick={() => navigate({ to: "/auth/mail", search: {} })}
              className="w-full rounded-xl bg-[#F8AFA6] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#e89d94]"
            >
              Continue with Mail
            </button>

            <p className="mt-1 text-center text-xs text-[#6b4f47]">
              No spam, no pressure. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="bg-[#120a08] px-6 py-8 text-center"
        style={{ borderTop: "1px solid #1f1210" }}
      >
        <Logo light />
        <p className="mt-3 text-xs text-[#6b4f47]">
          © 2026 CareerBloom · Built with care for career changers everywhere
        </p>
      </footer>
    </div>
  );
}
