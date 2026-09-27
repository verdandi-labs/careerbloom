import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useChat, type MessagePayload } from "@/hooks/useChat";
import { Compass, Loader2, Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/career-direction")({
  head: () => ({ meta: [{ title: "My Career Direction · careerBloom" }] }),
  component: CareerDirectionPage,
});

type CareerDirection = {
  career_direction_id: string;
  summary: string;
  created_at: string;
};

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

function CareerDirectionPage() {
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState("");

  const {
    data: current,
    isPending: currentPending,
    error: currentError,
  } = useQuery({
    queryKey: ["career-direction", "current"],
    queryFn: () => api<CareerDirection>("/career-direction/current"),
    retry: false,
  });
  const noCurrent =
    currentError instanceof ApiError && currentError.status === 404;

  useEffect(() => {
    (async () => {
      try {
        const conv = await api<{ id: string }>(
          "/chat/conversations/career-direction",
        );
        setConversationId(conv.id);
      } catch {
        /* conversationId stays null, hook won't load */
      }
    })();
  }, []);

  const {
    messages,
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
    context: "career_direction",
    greeting:
      "Hi, I'm Bloom your career companion. Tell me a little about where you are and where you'd like to go.",
    mapMessage,
  });

  async function saveAsCareerDirection(content: string) {
    if (!conversationId) return;
    const trimmed = content.trim();
    setSavingId(content);
    setSaveErr("");
    try {
      if (trimmed.length < 20) {
        setSaveErr("Career direction must be at least 20 characters.");
        return;
      }
      await api("/career-direction", {
        method: "POST",
        json: { summary: trimmed.slice(0, 500) },
      });
      await qc.invalidateQueries({ queryKey: ["career-direction"] });
    } catch (e) {
      setSaveErr(
        errorMessage(e, "Couldn't save career direction, please try again"),
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-9rem)] min-h-0 supports-[height:100dvh]:h-[calc(100dvh-9rem)]">
        <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
            Where you're headed
          </p>
          <h1 className="mt-2 font-display text-4xl">My Career Direction</h1>
          <p className="mt-2 max-w-lg text-sm text-foreground/75">
            Tell CareerBloom what's next for you so it can tailor its advice.
          </p>
        </header>

        {current && (
          <section className="glass p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55">
              Current career direction
            </p>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
              {current.summary}
            </p>
          </section>
        )}

        {currentPending && (
          <section className="glass p-5">
            <div className="grid place-items-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
            </div>
          </section>
        )}

        <section className="glass flex flex-col flex-1 min-h-0 p-6">
          {saveErr && (
            <p className="mb-3 rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {saveErr}
            </p>
          )}

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto py-4 pr-1"
          >
            {!loaded && (
              <div className="grid place-items-center py-10 text-xs text-foreground/50">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {loaded && loadError && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-foreground/70">{loadError}</p>
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
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`rounded-3xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-tr-md bg-secondary text-secondary-foreground" : "rounded-tl-md bg-white/75 backdrop-blur"}`}
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" &&
                    m.content &&
                    m.id &&
                    !m.content.startsWith("Hi, I'm Bloom") && (
                      <button
                        onClick={() => void saveAsCareerDirection(m.content)}
                        disabled={savingId === m.content}
                        className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-80 transition disabled:opacity-50"
                      >
                        {savingId === m.content ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Compass className="h-3 w-3" />
                        )}
                        Save as career direction
                      </button>
                    )}
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
                Thinking...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 rounded-full bg-white/75 p-2 pl-5 backdrop-blur mt-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming || !conversationId}
              className="flex-1 bg-transparent text-base outline-none placeholder:text-foreground/40 disabled:opacity-60"
              placeholder="Tell me about your career goals..."
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim() || !conversationId}
              className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
