import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiStream, errorMessage } from "@/lib/api";
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

type MessagePayload = {
  id: string;
  role: string;
  content: string;
  suggestion: Suggestion | null;
  applied_text: string | null;
  rejected: boolean;
};

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  suggestion: Suggestion | null;
  applied_text: string | null;
  rejected: boolean;
};

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [msgErrs, setMsgErrs] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: cv } = useQuery({
    queryKey: ["cv"],
    queryFn: () => api<Record<string, unknown>>("/cv"),
  });
  const cvLoaded = cv ? Object.values(cv).some(Boolean) : false;

  useEffect(() => {
    setLoaded(false);
    setMessages([]);
    setLoadError("");
    (async () => {
      try {
        const msgs = await api<MessagePayload[]>(
          `/chat/conversations/${conversationId}/messages`,
        );
        const loaded: Msg[] = (msgs ?? []).map((r) => ({
          id: r.id,
          role: r.role as "user" | "assistant",
          content: r.content,
          suggestion: r.suggestion,
          applied_text: r.applied_text,
          rejected: r.rejected,
        }));
        if (loaded.length === 0) {
          loaded.push({
            role: "assistant",
            content:
              "Hi, I'm Bloom your career companion. Tell me a little about where you are and where you'd like to go.",
            suggestion: null,
            applied_text: null,
            rejected: false,
          });
        }
        setMessages(loaded);
      } catch (e) {
        setLoadError(errorMessage(e, "Couldn't load messages, please refresh"));
      }
      setLoaded(true);
    })();
  }, [conversationId, retryKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);
  useEffect(() => {
    inputRef.current?.focus();
  }, [loading, conversationId]);

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

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const preSendCount = messages.filter((m) => m.id).length;
    const userMsg: Msg = {
      role: "user",
      content: text,
      suggestion: null,
      applied_text: null,
      rejected: false,
    };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const stream = await apiStream(
        `/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          json: { content: text },
        },
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistant = "";
      let streamFailed = false;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "",
          suggestion: null,
          applied_text: null,
          rejected: false,
        },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            if (json.error) {
              streamFailed = true;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: errorMessage(
                    json.error,
                    "Response interrupted, please try sending that again",
                  ),
                  suggestion: null,
                  applied_text: null,
                  rejected: false,
                };
                return copy;
              });
              continue;
            }
            if (json.content) {
              assistant += json.content;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistant,
                  suggestion: null,
                  applied_text: null,
                  rejected: false,
                };
                return copy;
              });
            }
          } catch {
            /* skip */
          }
        }
      }

      if (streamFailed) return;

      try {
        const msgs = await api<MessagePayload[]>(
          `/chat/conversations/${conversationId}/messages`,
        );
        if (!msgs || msgs.length < preSendCount + 2) return;
        const last = msgs?.[msgs.length - 1];
        if (last?.id) {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              id: last.id,
              role: "assistant",
              content: last.content,
              suggestion: last.suggestion,
              applied_text: last.applied_text,
              rejected: last.rejected,
            };
            return copy;
          });
        }
      } catch {
        /* keep the streamed text as-is */
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: errorMessage(e, "Couldn't send message, please try again"),
          suggestion: null,
          applied_text: null,
          rejected: false,
        },
      ]);
    } finally {
      setLoading(false);
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
                    (loading && i === messages.length - 1 ? "" : "")}
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
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <Loader2 className="h-3 w-3 animate-spin" /> Bloom is thinking…
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
          disabled={loading}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/40 disabled:opacity-60"
          placeholder="Tell me about yourself..."
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
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
            className={`rounded-full px-3 py-1.5 text-xs transition disabled:opacity-50 ${picked === opt ? "bg-accent text-accent-foreground" : "bg-secondary/40 hover:bg-secondary/70"}`}
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
          className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-xs hover:bg-white disabled:opacity-50"
        >
          <X className="h-3 w-3" /> Reject
        </button>
        <button
          disabled={!picked || busy}
          onClick={() => picked && onApply(picked)}
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-xs text-background disabled:opacity-40"
        >
          <Check className="h-3 w-3" /> Apply
        </button>
      </div>
    </div>
  );
}
