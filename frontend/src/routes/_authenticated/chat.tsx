import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { createConversation } from "@/lib/chat";
import { MessageCircleHeart, Plus, Trash2, Pencil, Check, X, Pin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat · careerBloom" }] }),
  component: ChatLayout,
});

type Conversation = { id: string; title: string; updated_at: string };

function ChatLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = useParams({ strict: false }) as { conversationId?: string };
  const activeId = params.conversationId;
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const load = useCallback(async () => {
    const data = await api<Conversation[]>("/chat/conversations");
    const all = data ?? [];
    const pinned = all.filter((c) => c.title === "Career Direction");
    const rest = all.filter((c) => c.title !== "Career Direction");
    setConvs([...pinned, ...rest]);
  }, []);

  useEffect(() => { load(); }, [load, pathname]);

  useEffect(() => {
    if (activeId) return;
    if (pathname !== "/chat") return;
    (async () => {
      const data = await api<Conversation[]>("/chat/conversations");
      let id = data?.[0]?.id;
      if (!id) id = (await createConversation()) ?? undefined;
      if (id) navigate({ to: "/chat/$conversationId", params: { conversationId: id }, replace: true });
    })();
  }, [activeId, pathname, navigate]);

  async function handleNew() {
    const id = await createConversation();
    if (id) {
      await load();
      navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
    }
  }

  async function handleDelete(id: string) {
    await api(`/chat/conversations/${id}`, { method: "DELETE" });
    const remaining = convs.filter((c) => c.id !== id);
    setConvs(remaining);
    setDeletingId(null);
    if (activeId === id) {
      if (remaining[0]) {
        navigate({ to: "/chat/$conversationId", params: { conversationId: remaining[0].id }, replace: true });
      } else {
        navigate({ to: "/chat", replace: true });
      }
    }
  }

  async function saveTitle(id: string) {
    const title = draftTitle.trim() || "Untitled";
    await api(`/chat/conversations/${id}`, { method: "PATCH", json: { title } });
    setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, title } : c)));
    setEditingId(null);
  }

  return (
    <AppShell>
      <div className="grid h-[calc(100vh-9rem)] gap-4 md:grid-cols-[280px_1fr]">
        <aside className="glass flex flex-col p-4">
          <button onClick={handleNew} className="mb-3 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-wider text-background transition hover:scale-[1.01]">
            <Plus className="h-3.5 w-3.5" /> New chat
          </button>
          <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.2em] text-foreground/50">History</p>
          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            {convs.length === 0 && <p className="px-2 py-4 text-xs italic text-foreground/50">No conversations yet.</p>}
            {convs.map((c) => {
              const active = c.id === activeId;
              const isEditing = editingId === c.id;
              const isDeleting = deletingId === c.id;
              const pinned = c.title === "Career Direction";
              return (
                <div key={c.id} className={`group flex items-center gap-1 rounded-2xl px-2 py-1.5 transition ${active ? "bg-sidebar-accent" : "hover:bg-white/50"}`}>
                  {isEditing ? (
                    <>
                      <input autoFocus value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveTitle(c.id); if (e.key === "Escape") setEditingId(null); }} className="flex-1 rounded-lg bg-white/90 px-2 py-1 text-xs outline-none" />
                      <button onClick={() => saveTitle(c.id)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setEditingId(null)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white"><X className="h-3 w-3" /></button>
                    </>
                  ) : isDeleting ? (
                    <>
                      <span className="flex-1 truncate px-1 text-xs text-foreground/70">Delete conversation?</span>
                      <button onClick={() => setDeletingId(null)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white"><X className="h-3 w-3" /></button>
                      <button onClick={() => handleDelete(c.id)} className="grid h-6 w-6 place-items-center rounded-full bg-rose-50 text-rose-600 hover:bg-white"><Trash2 className="h-3 w-3" /></button>
                    </>
                  ) : (
                    <>
                      <Link to="/chat/$conversationId" params={{ conversationId: c.id }} className="flex flex-1 items-center gap-2 truncate text-xs" title={c.title}>
                        {pinned ? <Pin className="h-3.5 w-3.5 shrink-0 text-secondary-foreground" /> : <MessageCircleHeart className="h-3.5 w-3.5 shrink-0 text-foreground/60" />}
                        <span className={`truncate ${pinned ? "font-medium" : ""}`}>{c.title}</span>
                      </Link>
                      {!pinned && (
                        <>
                          <button onClick={() => { setEditingId(c.id); setDraftTitle(c.title); }} className="grid h-6 w-6 place-items-center rounded-full text-foreground/50 opacity-70 transition hover:bg-white hover:text-foreground md:opacity-0 md:group-hover:opacity-100" title="Rename"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => setDeletingId(c.id)} className="grid h-6 w-6 place-items-center rounded-full text-foreground/50 opacity-70 transition hover:bg-white hover:text-foreground md:opacity-0 md:group-hover:opacity-100" title="Delete"><Trash2 className="h-3 w-3" /></button>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <Outlet />
      </div>
    </AppShell>
  );
}
