import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Check, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { type MessagePayload } from "@/hooks/useChat";
import { createConversation } from "@/lib/chat";
import { ChatPanel } from "@/components/ChatPanel";

export const Route = createFileRoute(
  "/_authenticated/job-compatibility/$conversationId",
)({
  head: () => ({ meta: [{ title: "Job Compatibility · careerBloom" }] }),
  component: ConversationPage,
});

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

function mapMessage(p: MessagePayload): Msg {
  return {
    id: p.id,
    role: p.role as "user" | "assistant",
    content: p.content,
  };
}

type ApplyState =
  "idle" | "saving" | "saved" | "duplicate" | "dismissed" | "error";

function ApplyCard() {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [state, setState] = useState<ApplyState>("idle");

  async function save() {
    setState("saving");
    try {
      const res = await api<{ created: boolean }>("/applications", {
        method: "POST",
        json: {
          job_title: jobTitle.trim() || null,
          company_name: companyName.trim() || null,
        },
      });
      setState(res.created ? "saved" : "duplicate");
    } catch {
      setState("error");
    }
  }

  if (state === "dismissed") return null;
  if (state === "saved") {
    return (
      <p className="rounded-3xl border border-white/60 bg-white/70 px-4 py-3 text-xs text-foreground/70 backdrop-blur">
        Saved to your applications.
      </p>
    );
  }
  if (state === "duplicate") {
    return (
      <p className="rounded-3xl border border-white/60 bg-white/70 px-4 py-3 text-xs text-foreground/70 backdrop-blur">
        Already in your applications.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
      <p className="text-xs leading-relaxed text-foreground/70">
        Thinking of going for it? I can save this to your applications so you
        have a record of it.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Role"
          aria-label="Role"
          className="w-full rounded-2xl bg-white/85 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary sm:w-44"
        />
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company"
          aria-label="Company"
          className="w-full rounded-2xl bg-white/85 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-secondary sm:w-44"
        />
      </div>
      {state === "error" && (
        <p className="text-xs text-destructive">
          Couldn't save to your applications, please try again
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => void save()}
          disabled={state === "saving"}
          className="inline-flex min-h-9 items-center gap-1 rounded-full bg-foreground px-3 text-xs text-background disabled:opacity-40"
        >
          {state === "saving" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}{" "}
          Yes, save it
        </button>
        <button
          onClick={() => setState("dismissed")}
          className="inline-flex min-h-9 items-center rounded-full bg-white/85 px-3 text-xs text-foreground/70 transition hover:bg-white"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();

  async function startNewChat() {
    const id = await createConversation("job_compatibility");
    if (id)
      navigate({
        to: "/job-compatibility/$conversationId",
        params: { conversationId: id },
      });
  }

  return (
    <section className="glass flex min-h-0 flex-col p-6">
      <header className="flex items-center justify-between gap-3 border-b border-white/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl">Job Compatibility</h1>
            <p className="text-xs text-foreground/60">
              Let's see how well a role fits you
            </p>
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-3 py-2 text-xs uppercase tracking-wider text-background transition hover:scale-[1.01]"
        >
          <Plus className="h-3.5 w-3.5" /> New chat
        </button>
      </header>
      <ChatPanel
        conversationId={conversationId}
        feature="job_compatibility"
        greeting="Hi I'm Bloom let's look at this role together and see if it's a good fit"
        placeholder="Tell me about the role you're considering..."
        mapMessage={mapMessage}
        className="flex-1"
        renderMessageExtra={(msg, _send, isLast) => {
          const m = msg as Msg;
          if (!isLast || m.role !== "assistant" || !m.id || m.isError) {
            return null;
          }
          return <ApplyCard key={m.id} />;
        }}
      />
    </section>
  );
}
