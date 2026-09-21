import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";
import { useChat, type MessagePayload } from "@/hooks/useChat";
import { createConversation } from "@/lib/chat";
import { Check, Loader2, Plus, Send, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  head: () => ({ meta: [{ title: "Chat · careerBloom" }] }),
  component: ConversationPage,
});

type Suggestion = {
  type: "suggestion";
  section: string;
  original: string;
  options: string[];
};

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  suggestion: Suggestion | null;
  applied_text: string | null;
  rejected: boolean;
  isError?: boolean;
};

function mapMessage(p: MessagePayload): Msg {
  return {
    id: p.id,
    role: p.role as "user" | "assistant",
    content: p.content,
    suggestion: (p.suggestion as Suggestion) ?? null,
    applied_text: p.applied_text,
    rejected: p.rejected,
  };
}

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();
  const [retryKey, setRetryKey] = useState(0);
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [msgErrs, setMsgErrs] = useState<Record<string, string>>({});

  const { data: cv } = useQuery({
    queryKey: ["cv"],
    queryFn: () => api<Record<string, unknown>>("/cv"),
  });
  const cvLoaded = cv ? Object.values(cv).some(Boolean) : false;

  const {
    messages,
    setMessages,
    input,
    setInput,
    send,
    isStreaming,
    loaded,
    loadError,
    scrollRef,
    inputRef,
    retry,
  } = useChat<Msg>({
    conversationId,
    greeting:
      "Hi, I'm Bloom your career companion. Tell me a little about where you are and where you'd like to go.",
    mapMessage,
    onStreamEnd: (last, set) => {
      set((m) => {
        const copy = [...m];
        const lastMsg = copy[copy.length - 1];
        copy[copy.length - 1] = {
          ...lastMsg,
          id: last.id,
          suggestion: (last.suggestion as Suggestion) ?? null,
          applied_text: last.applied_text,
          rejected: last.rejected,
        };
        return copy;
      });
    },
  });

  async function applySuggestion(msg: Msg, chosen: string) {
    const id = msg.id;
    if (!id) return;
    setBusy((prev) => new Set(prev).add(id));
    setMsgErrs((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await api<MessagePayload>(
        `/chat/conversations/${conversationId}/messages/${id}/apply`,
        { method: "POST", json: { chosen } },
      );
      setMessages((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, applied_text: res.applied_text, rejected: res.rejected }
            : x,
        ),
      );
    } catch (e) {
      setMsgErrs((prev) => ({
        ...prev,
        [id]: errorMessage(e, "Couldn't apply suggestion, please try again"),
      }));
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function rejectSuggestion(msg: Msg) {
    const id = msg.id;
    if (!id) return;
    setBusy((prev) => new Set(prev).add(id));
    setMsgErrs((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await api<MessagePayload>(
        `/chat/conversations/${conversationId}/messages/${id}/reject`,
        { method: "POST" },
      );
      setMessages((prev) =>
        prev.map((x) => (x.id === id ? { ...x, rejected: res.rejected } : x)),
      );
    } catch (e) {
      setMsgErrs((prev) => ({
        ...prev,
        [id]: errorMessage(e, "Couldn't reject suggestion, please try again"),
      }));
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function startNewChat() {
    const id = await createConversation();
    if (id)
      navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
  }

  return (
    <section className="glass flex flex-col p-6 min-h-0">
      <header className="flex items-center justify-between gap-3 border-b border-white/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-2xl">Bloom your AI coach</h1>
            <p className="text-xs text-foreground/60">
              {cvLoaded
                ? "I've read your CV. Let's make it shine."
                : "Upload your CV anytime I'll learn it."}
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

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto py-6 pr-1"
      >
        {!loaded && (
          <div className="grid place-items-center py-10 text-xs text-foreground/50">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {loaded && loadError && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-foreground/70">{loadError}</p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="rounded-full bg-white/75 px-4 py-2 text-xs hover:bg-white"
            >
              Try again
            </button>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={m.id ?? i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}
          >
            {m.role === "assistant" && (
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="max-w-[75%] space-y-3">
              {m.content && (
                <div
                  className={`rounded-3xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-tr-md bg-secondary text-secondary-foreground" : "rounded-tl-md bg-white/75 backdrop-blur"}`}
                >
                  {m.content ||
                    (isStreaming && i === messages.length - 1 ? "" : "")}
                </div>
              )}
              {m.role === "assistant" &&
                m.suggestion &&
                (m.applied_text ? (
                  <ConfirmedCard text={m.applied_text} />
                ) : m.rejected ? (
                  <DismissedCard />
                ) : (
                  <SuggestionCard
                    s={m.suggestion}
                    busy={Boolean(m.id && busy.has(m.id))}
                    error={m.id ? msgErrs[m.id] : undefined}
                    onApply={(chosen) => void applySuggestion(m, chosen)}
                    onReject={() => void rejectSuggestion(m)}
                  />
                ))}
            </div>
          </div>
        ))}
        {!isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1]?.isError && (
            <button
              onClick={retry}
              className="rounded-full bg-white/75 px-4 py-2 text-xs hover:bg-white"
            >
              Retry
            </button>
          )}
        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-1 text-sm text-pink-300 animate-pulse">
            ✨ Thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 rounded-full bg-white/75 p-2 pl-5 backdrop-blur"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-foreground/40 disabled:opacity-60"
          placeholder="Tell me about yourself..."
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}

function ConfirmedCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur space-y-2 shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-accent">
        <Check className="h-3 w-3" /> Applied to your CV
      </p>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}

function DismissedCard() {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
      <p className="inline-flex items-center gap-1 text-xs text-foreground/50">
        <X className="h-3 w-3" /> Suggestion dismissed
      </p>
    </div>
  );
}

function SuggestionCard({
  s,
  onApply,
  onReject,
  busy,
  error,
}: {
  s: Suggestion;
  onApply: (chosen: string) => void;
  onReject: () => void;
  busy?: boolean;
  error?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur space-y-3 shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
      <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
        {s.section}
      </p>
      <p className="text-xs italic text-foreground/50 line-through">
        {s.original}
      </p>
      <div className="flex flex-wrap gap-2">
        {s.options.map((opt) => (
          <button
            key={opt}
            onClick={() => setPicked(opt)}
            disabled={busy}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs transition disabled:opacity-50 ${picked === opt ? "bg-accent text-accent-foreground" : "bg-secondary/40 hover:bg-secondary/70"}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={onReject}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/80 px-3 text-xs hover:bg-white disabled:opacity-50"
        >
          <X className="h-3 w-3" /> Reject
        </button>
        <button
          disabled={!picked || busy}
          onClick={() => picked && onApply(picked)}
          className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full bg-foreground px-4 text-xs text-background disabled:opacity-40"
        >
          <Check className="h-3 w-3" /> Apply
        </button>
      </div>
    </div>
  );
}
