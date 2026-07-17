import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api, apiStream } from "@/lib/api";
import { createConversation } from "@/lib/chat";
import { Send, Sparkles, Check, X, Pencil, Loader2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  head: () => ({ meta: [{ title: "Chat · careerBloom" }] }),
  component: ConversationPage,
});

type Suggestion = { type: "suggestion"; section?: string; original: string; options: string[] };
type Msg = { id?: string; role: "user" | "assistant"; content: string; suggestion?: Suggestion | null; applied?: string | null; rejected?: boolean };

function parseSuggestion(text: string): Suggestion | null {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  const raw = (match ? match[1] : text).trim();
  try {
    const obj = JSON.parse(raw);
    if (obj && obj.type === "suggestion" && Array.isArray(obj.options) && typeof obj.original === "string") return obj as Suggestion;
  } catch { /* not a suggestion */ }
  return null;
}

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cvText, setCvText] = useState<string>("");
  const [convTitle, setConvTitle] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ extracted_text: string | null }[]>("/cv/sections");
        const latest = data?.[0];
        if (latest?.extracted_text) setCvText(latest.extracted_text);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    setLoaded(false);
    setMessages([]);
    (async () => {
      try {
        const msgs = await api<Array<{ id: string; role: string; content: string; suggestion: Suggestion | null; applied_text: string | null; rejected: boolean }>>(
          `/chat/conversations/${conversationId}/messages`
        );
        const loaded: Msg[] = (msgs ?? []).map((r) => ({
          id: r.id,
          role: r.role as "user" | "assistant",
          content: r.content,
          suggestion: r.suggestion ?? null,
          applied: r.applied_text ?? null,
          rejected: r.rejected ?? false,
        }));
        if (loaded.length === 0) {
          loaded.push({ role: "assistant", content: "Hi, I'm Bloom \uD83C\uDF38 \u2014 your career companion. Tell me a little about where you are and where you'd like to go." });
        }
        setMessages(loaded);
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, [conversationId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { inputRef.current?.focus(); }, [loading, conversationId]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const stream = await apiStream(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        json: { content: text },
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistant = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

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
            if (json.content) {
              assistant += json.content;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch { /* skip */ }
        }
      }

      const sugg = parseSuggestion(assistant);
      const finalMsg: Msg = sugg
        ? { role: "assistant", content: "Here's a softer way to phrase that \u2014 pick whichever feels most you:", suggestion: sugg }
        : { role: "assistant", content: assistant };
      setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = finalMsg; return copy; });
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Connection hiccup: ${String(e)}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function startNewChat() {
    const id = await createConversation();
    if (id) navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
  }

  return (
    <section className="glass flex flex-col p-6 min-h-0">
      <header className="flex items-center justify-between gap-3 border-b border-white/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Sparkles className="h-4 w-4" /></div>
          <div>
            <h1 className="font-display text-2xl">Bloom \u2014 your AI coach</h1>
            <p className="text-xs text-foreground/60">{cvText ? "I've read your CV. Let's make it shine." : "Upload your CV anytime \u2014 I'll learn it."}</p>
          </div>
        </div>
        <button onClick={startNewChat} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-3 py-2 text-xs uppercase tracking-wider text-background transition hover:scale-[1.01]">
          <Plus className="h-3.5 w-3.5" /> New chat
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-6 pr-1">
        {!loaded && <div className="grid place-items-center py-10 text-xs text-foreground/50"><Loader2 className="h-4 w-4 animate-spin" /></div>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {m.role === "assistant" && <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Sparkles className="h-3.5 w-3.5" /></div>}
            <div className="max-w-[75%] space-y-3">
              {m.content && (
                <div className={`rounded-3xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-tr-md bg-secondary text-secondary-foreground" : "rounded-tl-md bg-white/75 backdrop-blur"}`}>
                  {m.content || (loading && i === messages.length - 1 ? "\u2026" : "")}
                </div>
              )}
              {m.suggestion && !m.rejected && !m.applied && (
                <SuggestionCard s={m.suggestion} onApply={() => {}} onReject={() => {}} />
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-xs text-foreground/50"><Loader2 className="h-3 w-3 animate-spin" /> Bloom is thinking\u2026</div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 rounded-full bg-white/75 p-2 pl-5 backdrop-blur">
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/40 disabled:opacity-60" placeholder="Tell me about yourself..." />
        <button type="submit" disabled={loading || !input.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}

function SuggestionCard({ s, onApply, onReject }: { s: Suggestion; onApply: () => void; onReject: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur space-y-3 shadow-[0_8px_24px_-12px_rgba(248,175,166,0.6)]">
      {s.section && <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">{s.section}</p>}
      <p className="text-xs italic text-foreground/50 line-through">{s.original}</p>
      <div className="flex flex-wrap gap-2">
        {s.options.map((opt) => (
          <button key={opt} onClick={() => setPicked(opt)} className={`rounded-full px-3 py-1.5 text-xs transition ${picked === opt ? "bg-accent text-accent-foreground" : "bg-secondary/40 hover:bg-secondary/70"}`}>{opt}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button onClick={onReject} className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-xs hover:bg-white"><X className="h-3 w-3" /> Reject</button>
        <button disabled={!picked} onClick={onApply} className="ml-auto inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-xs text-background disabled:opacity-40"><Check className="h-3 w-3" /> Apply</button>
      </div>
    </div>
  );
}
