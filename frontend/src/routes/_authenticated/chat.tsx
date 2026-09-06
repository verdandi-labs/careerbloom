import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, errorMessage } from "@/lib/api";
import { createConversation } from "@/lib/chat";
import {
  MessageCircleHeart,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Pin,
  History,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat · careerBloom" }] }),
  component: ChatLayout,
});

type Conversation = { id: string; title: string; is_career_direction: boolean };

function ChatLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = useParams({ strict: false }) as { conversationId?: string };
  const activeId = params.conversationId;
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [listError, setListError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setListError("");
    try {
      const data = await api<Conversation[]>("/chat/conversations");
      const all = data ?? [];
      const pinned = all.filter((c) => c.is_career_direction);
      const rest = all.filter((c) => !c.is_career_direction);
      setConvs([...pinned, ...rest]);
    } catch (e) {
      setListError(
        errorMessage(e, "Couldn't load conversations, please refresh"),
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    if (activeId) return;
    if (pathname !== "/chat") return;
    (async () => {
      setListError("");
      try {
        const data = await api<Conversation[]>("/chat/conversations");
        const id = data?.[0]?.id ?? (await createConversation());
        if (id)
          navigate({
            to: "/chat/$conversationId",
            params: { conversationId: id },
            replace: true,
          });
      } catch (e) {
        setListError(
          errorMessage(e, "Couldn't load conversations, please refresh"),
        );
      }
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
        navigate({
          to: "/chat/$conversationId",
          params: { conversationId: remaining[0].id },
          replace: true,
        });
      } else {
        navigate({ to: "/chat", replace: true });
      }
    }
  }

  async function saveTitle(id: string) {
    const title = draftTitle.trim() || "Untitled";
    await api(`/chat/conversations/${id}`, {
      method: "PATCH",
      json: { title },
    });
    setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, title } : c)));
    setEditingId(null);
  }

  return (
    <AppShell>
      <div className="relative flex h-[calc(100vh-9rem)] min-h-0 supports-[height:100dvh]:h-[calc(100dvh-9rem)] gap-4 md:grid md:grid-cols-[280px_1fr]">
        {drawerOpen && (
          <button
            aria-label="Close conversation list"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-20 bg-foreground/30 backdrop-blur-sm md:hidden"
          />
        )}
        <aside
          className={`glass fixed inset-y-2 left-2 z-30 flex w-[min(280px,calc(100vw-4rem))] flex-col p-4 transition-transform duration-200 md:static md:inset-auto md:z-auto md:w-auto md:translate-x-0 ${
            drawerOpen ? "translate-x-0" : "-translate-x-[110%]"
          }`}
        >
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-foreground/60 hover:bg-white/60 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleNew}
            className="mb-3 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-wider text-background transition hover:scale-[1.01]"
          >
            <Plus className="h-3.5 w-3.5" /> New chat
          </button>
          <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            History
          </p>
          {listError && (
            <p className="mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {listError}
            </p>
          )}
          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            {convs.length === 0 && (
              <p className="px-2 py-4 text-xs italic text-foreground/50">
                No conversations yet.
              </p>
            )}
            {convs.map((c) => {
              const active = c.id === activeId;
              const isEditing = editingId === c.id;
              const isDeleting = deletingId === c.id;
              const pinned = c.is_career_direction;
              return (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 rounded-2xl px-2 py-1.5 transition ${active ? "bg-sidebar-accent" : "hover:bg-white/50"}`}
                >
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTitle(c.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 rounded-lg bg-white/90 px-2 py-1 text-base outline-none"
                      />
                      <button
                        onClick={() => saveTitle(c.id)}
                        className="grid h-6 w-6 place-items-center rounded-full hover:bg-white"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="grid h-6 w-6 place-items-center rounded-full hover:bg-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : isDeleting ? (
                    <>
                      <span className="flex-1 truncate px-1 text-xs text-foreground/70">
                        Delete?
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="grid h-6 w-6 place-items-center rounded-full text-xs text-foreground/40 hover:text-foreground hover:bg-white"
                      >
                        No
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
                        }}
                        className="grid h-6 w-6 place-items-center rounded-full bg-rose-50 text-xs font-medium text-rose-500 hover:bg-rose-100"
                      >
                        Yes
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/chat/$conversationId"
                        params={{ conversationId: c.id }}
                        onClick={() => setDrawerOpen(false)}
                        className="flex flex-1 items-center gap-2 truncate text-xs"
                        title={c.title}
                      >
                        {pinned ? (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-secondary-foreground" />
                        ) : (
                          <MessageCircleHeart className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
                        )}
                        <span
                          className={`truncate ${pinned ? "font-medium" : ""}`}
                        >
                          {c.title}
                        </span>
                      </Link>
                      {!pinned && (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setDraftTitle(c.title);
                            }}
                            className="grid h-6 w-6 place-items-center rounded-full text-foreground/50 opacity-70 transition hover:bg-white hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                            title="Rename"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(c.id);
                            }}
                            className="grid h-6 w-6 place-items-center rounded-full text-foreground/50 opacity-70 transition hover:bg-white hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <button
            onClick={() => setDrawerOpen(true)}
            className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs text-foreground/80 backdrop-blur hover:bg-white md:hidden"
          >
            <History className="h-3.5 w-3.5" /> History
          </button>
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
