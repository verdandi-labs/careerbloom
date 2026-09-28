import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useChat, type MessagePayload } from "@/hooks/useChat";
import { createConversation } from "@/lib/chat";
import { ChatPanel } from "@/components/ChatPanel";
import {
  CvSuggestionCard,
  type CvSuggestion,
  type CvRowSuggestion,
} from "@/components/CvSuggestionCard";
import { Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cv-chat/$conversationId")(
  {
    head: () => ({ meta: [{ title: "CV Chat · careerBloom" }] }),
    component: ConversationPage,
  },
);

type Suggestion = CvSuggestion | CvRowSuggestion;

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  suggestion: Suggestion | null;
  isError?: boolean;
};

function mapMessage(p: MessagePayload): Msg {
  return {
    id: p.id,
    role: p.role as "user" | "assistant",
    content: p.content,
    suggestion: (p.suggestion as Suggestion) ?? null,
  };
}

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();

  const { data: cv } = useQuery({
    queryKey: ["cv"],
    queryFn: () => api<Record<string, unknown>>("/cv"),
  });
  const cvLoaded = cv ? Object.values(cv).some(Boolean) : false;

  async function startNewChat() {
    const id = await createConversation();
    if (id)
      navigate({
        to: "/cv-chat/$conversationId",
        params: { conversationId: id },
      });
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
      <ChatPanel
        conversationId={conversationId}
        context="cv_chat"
        greeting="Hi, I'm Bloom your career companion. Tell me a little about where you are and where you'd like to go."
        placeholder="Tell me about yourself..."
        mapMessage={mapMessage}
        className="flex-1"
        renderMessageExtra={(msg, send) => {
          const s = (msg as Msg).suggestion;
          if (!s) return null;
          return (
            <CvSuggestionCard
              suggestion={s}
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
