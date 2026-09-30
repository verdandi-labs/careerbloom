import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ChatPanel } from "@/components/ChatPanel";
import { ConversationDeleteControl } from "@/components/ConversationDeleteControl";
import {
  CoverLetterSuggestionCard,
  type CoverLetterSuggestion,
} from "@/components/CoverLetterSuggestionCard";
import { API_BASE, api, errorMessage } from "@/lib/api";
import { type MessagePayload } from "@/hooks/useChat";
import { useDeleteConversation } from "@/hooks/useDeleteConversation";
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

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  suggestion: MsgSuggestion | null;
  isError?: boolean;
};

type Letter = {
  letter_id: string;
  name: string | null;
  text: string;
  created_at: string;
};

const GREETING =
  "Hi! I'm Bloom 🌸 Let's work on your cover letter. What role are you applying for, and which company?";

function mapMessage(p: MessagePayload): Msg {
  return {
    id: p.id,
    role: p.role as "user" | "assistant",
    content: p.content,
    suggestion: (p.suggestion as MsgSuggestion) ?? null,
  };
}

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
  const {
    deletingId: deletingConvId,
    setDeletingId: setDeletingConvId,
    confirmDelete: confirmDeleteConv,
  } = useDeleteConversation({
    items: conversations ?? [],
    setItems: (updated) =>
      qc.setQueryData(["cover-letter-conversations"], updated),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["cover-letter-conversations"] }),
    onError: (_, message) => setActionErr(message),
  });

  async function newCoverLetter() {
    setCreating(true);
    setActionErr("");
    try {
      const id = await createCoverLetterConversation();
      if (id) {
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
    setActiveId(c.id);
  }

  function back() {
    setActiveId(null);
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
        <ConversationView conversationId={activeId} onBack={back} />
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
                <div
                  key={c.id}
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
                  {deletingConvId !== c.id && (
                    <button
                      onClick={() => resume(c)}
                      className="text-xs text-foreground/40 hover:text-foreground"
                    >
                      Resume
                    </button>
                  )}
                  <ConversationDeleteControl
                    isDeleting={deletingConvId === c.id}
                    onDelete={() => setDeletingConvId(c.id)}
                    onCancel={() => setDeletingConvId(null)}
                    onConfirm={() => void confirmDeleteConv(c.id)}
                  />
                </div>
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
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();

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

      <ChatPanel
        conversationId={conversationId}
        context="cover_letter"
        greeting={GREETING}
        placeholder="Which role are you applying for?"
        mapMessage={mapMessage}
        className="flex-1"
        renderMessageExtra={(msg, send) => {
          const s = (msg as Msg).suggestion;
          if (!s || s.type !== "cover_letter") return null;
          return (
            <CoverLetterSuggestionCard
              suggestion={s as CoverLetterSuggestion}
              onSave={saveLetter}
              onDislike={() =>
                send(
                  "I don't like this suggestion, ask me questions to understand what I'm looking for",
                )
              }
            />
          );
        }}
      />
    </section>
  );
}
