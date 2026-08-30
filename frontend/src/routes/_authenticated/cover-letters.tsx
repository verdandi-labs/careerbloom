import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import {
  CoverLetterSuggestionCard,
  type CoverLetterSuggestion,
} from "@/components/CoverLetterSuggestionCard";
import { API_BASE, ApiError, api, apiStream, errorMessage } from "@/lib/api";
import {
  createCoverLetterConversation,
  listCoverLetterConversations,
  type ConversationSummary,
} from "@/lib/chat";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Mail,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/cover-letters")({
  head: () => ({ meta: [{ title: "Cover Letters · careerBloom" }] }),
  component: CoverLettersPage,
});

type Suggestion = {
  type: "suggestion";
  section: string;
  original: string;
  options: string[];
};

type MsgSuggestion = Suggestion | CoverLetterSuggestion;

type MessagePayload = {
  id: string;
  role: string;
  content: string;
  suggestion: MsgSuggestion | null;
  applied_text: string | null;
  rejected: boolean;
};

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  suggestion: MsgSuggestion | null;
  applied_text: string | null;
  rejected: boolean;
};

type Letter = {
  letter_id: string;
  name: string | null;
  text: string;
  created_at: string;
};

const GREETING =
  "Hi! I'm Bloom 🌸 Let's work on your cover letter. What role are you applying for, and which company?";

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CoverLettersPage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);

  const { data: letters, isPending } = useQuery({
    queryKey: ["cover-letters"],
    queryFn: () => api<Letter[]>("/cover-letters"),
  });
  const { data: conversations } = useQuery({
    queryKey: ["cover-letter-conversations"],
    queryFn: () => listCoverLetterConversations(),
  });

  const [deleting, setDeleting] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState("");
  const [creating, setCreating] = useState(false);

  async function newCoverLetter() {
    setCreating(true);
    setActionErr("");
    try {
      const id = await createCoverLetterConversation();
      if (id) {
        setFresh(true);
        setActiveId(id);
      }
    } catch (e) {
      setActionErr(
        errorMessage(e, "Couldn't start a cover letter, please try again"),
      );
    } finally {
      setCreating(false);
    }
  }

  function resume(c: ConversationSummary) {
    setFresh(false);
    setActiveId(c.id);
  }

  function back() {
    setActiveId(null);
    setFresh(false);
    void qc.invalidateQueries({ queryKey: ["cover-letter-conversations"] });
  }

  async function deleteLetter(id: string) {
    setDeleting(id);
    setActionErr("");
    try {
      await api(`/cover-letters/${id}`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey: ["cover-letters"] });
    } catch (e) {
      setActionErr(
        errorMessage(e, "Couldn't delete cover letter, please try again"),
      );
    } finally {
      setDeleting(null);
    }
  }

  async function exportPdf(letter: Letter) {
    setExporting(letter.letter_id);
    setActionErr("");
    try {
      const blob = await fetch(
        `${API_BASE}/cover-letters/${letter.letter_id}/export/pdf`,
        { method: "POST", credentials: "include" },
      ).then((r) => r.blob());
      await downloadBlob(blob, `${letter.name ?? "cover-letter"}.pdf`);
    } catch (e) {
      setActionErr(errorMessage(e, "Export failed, please try again"));
    } finally {
      setExporting(null);
    }
  }

  return (
    <AppShell>
      {activeId ? (
        <ConversationView
          conversationId={activeId}
          fresh={fresh}
          onBack={back}
          savedCount={letters?.length ?? 0}
        />
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4 rounded-[20px] bg-secondary/70 px-7 py-7 backdrop-blur-md shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
                Your library
              </p>
              <h1 className="mt-2 font-display text-4xl">Cover Letters</h1>
              <p className="mt-2 max-w-md text-sm text-foreground/75">
                Each one a little love letter to a future role.
              </p>
            </div>
            <button
              onClick={() => void newCoverLetter()}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-background disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              New Cover Letter
            </button>
          </header>

          {actionErr && (
            <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {actionErr}
            </p>
          )}

          <h2 className="mt-10 font-display text-2xl">Saved letters</h2>
          {isPending ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
            </div>
          ) : letters && letters.length > 0 ? (
            <section className="mt-4 grid grid-cols-1 gap-5">
              {letters.map((l) => (
                <article
                  key={l.letter_id}
                  className="glass flex flex-col gap-4 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl">
                          {l.name ?? "Cover letter"}
                        </h3>
                        <p className="text-xs text-foreground/60">
                          {new Date(l.created_at).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => void exportPdf(l)}
                        disabled={exporting === l.letter_id}
                        className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-2 text-xs hover:bg-white disabled:opacity-50"
                      >
                        {exporting === l.letter_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}{" "}
                        Export PDF
                      </button>
                      <button
                        onClick={() => void deleteLetter(l.letter_id)}
                        disabled={deleting === l.letter_id}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-foreground/60 hover:bg-white disabled:opacity-50"
                      >
                        {deleting === l.letter_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/75">
                    {l.text}
                  </p>
                </article>
              ))}
            </section>
          ) : (
            <div className="glass mt-4 p-10 text-center text-sm text-foreground/60">
              No letters yet. Start a new cover letter and Bloom will help you
              write one.
            </div>
          )}

          <h2 className="mt-10 font-display text-2xl">Past conversations</h2>
          {conversations && conversations.length > 0 ? (
            <section className="mt-4 grid grid-cols-1 gap-3">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => resume(c)}
                  className="glass flex items-center gap-3 p-5 text-left transition hover:bg-white/60"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg">{c.title}</p>
                    <p className="text-xs text-foreground/60">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-foreground/40">Resume</span>
                </button>
              ))}
            </section>
          ) : (
            <div className="glass mt-4 p-8 text-center text-sm text-foreground/60">
              No previous conversations yet.
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function ConversationView({
  conversationId,
  fresh,
  onBack,
  savedCount,
}: {
  conversationId: string;
  fresh: boolean;
  onBack: () => void;
  savedCount: number;
}) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [listErr, setListErr] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoaded(false);
    setMessages([]);
    setLoadError("");
    (async () => {
      try {
        const msgs = await api<MessagePayload[]>(
          `/chat/conversations/${conversationId}/messages`,
        );
        const loadedMsgs: Msg[] = (msgs ?? []).map((r) => ({
          id: r.id,
          role: r.role as "user" | "assistant",
          content: r.content,
          suggestion: r.suggestion,
          applied_text: r.applied_text,
          rejected: r.rejected,
        }));
        if (loadedMsgs.length === 0) {
          loadedMsgs.push({
            role: "assistant",
            content: GREETING,
            suggestion: null,
            applied_text: null,
            rejected: false,
          });
        }
        setMessages(loadedMsgs);
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

  async function removeMessage(id: string) {
    setDeleting(id);
    setListErr("");
    try {
      const res = await fetch(
        `${API_BASE}/chat/conversations/${conversationId}/messages/${id}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        throw new ApiError(`Delete failed (${res.status})`, res.status);
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setListErr(errorMessage(e, "Couldn't delete message, please try again"));
    } finally {
      setDeleting(null);
    }
  }

  async function saveLetter(text: string, name: string): Promise<boolean> {
    try {
      await api("/cover-letters/save", {
        method: "POST",
        json: { text, name: name || null },
      });
      await qc.invalidateQueries({ queryKey: ["cover-letters"] });
      return true;
    } catch {
      return false;
    }
  }

  async function sendText(text: string): Promise<void> {
    const clean = text.trim();
    if (!clean || loading) return;
    setInput("");
    const preSendCount = messages.filter((m) => m.id).length;
    const userMsg: Msg = {
      role: "user",
      content: clean,
      suggestion: null,
      applied_text: null,
      rejected: false,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const stream = await apiStream(
        `/chat/conversations/${conversationId}/messages`,
        { method: "POST", json: { content: clean } },
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

      if (streamFailed) {
        throw new Error("Stream failed");
      }

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
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function send() {
    void sendText(input);
  }

  return (
    <section className="glass flex min-h-0 flex-col p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/40 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-foreground/70 hover:bg-white"
            aria-label="Back to cover letters"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-2xl">Cover Letters</h1>
          </div>
        </div>
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
        {listErr && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {listErr}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={m.id ?? i}
            className={`group flex items-start ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}
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
                  {m.content}
                </div>
              )}
              {m.role === "assistant" &&
                m.suggestion &&
                m.suggestion.type === "cover_letter" && (
                  <CoverLetterSuggestionCard
                    suggestion={m.suggestion}
                    onSave={saveLetter}
                    onDislike={() =>
                      sendText("I don't like any of these options.")
                    }
                    savedCount={savedCount}
                  />
                )}
              {m.role === "assistant" &&
                m.suggestion &&
                m.suggestion.type !== "cover_letter" && (
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
                    <p className="text-sm text-foreground/70">
                      Bloom returned an unexpected response. Please try again.
                    </p>
                  </div>
                )}
            </div>
            {m.id && (
              <button
                onClick={() => void removeMessage(m.id!)}
                disabled={deleting === m.id}
                className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-foreground/30 opacity-0 transition hover:bg-white hover:text-foreground/70 group-hover:opacity-100 disabled:opacity-30"
                aria-label="Delete message"
              >
                {deleting === m.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
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
          className="flex-1 bg-transparent text-base outline-none placeholder:text-foreground/40 disabled:opacity-60"
          placeholder="Which role are you applying for?"
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
