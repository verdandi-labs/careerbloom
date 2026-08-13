import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { Compass, Loader2, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transitions")({
  head: () => ({ meta: [{ title: "My Transition · careerBloom" }] }),
  component: TransitionsPage,
});

const MIN_LENGTH = 20;
const MAX_LENGTH = 500;

type Transition = {
  transition_id: string;
  transition: string;
  created_at: string;
};

function TransitionsPage() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    data: current,
    isPending: currentPending,
    error: currentError,
  } = useQuery({
    queryKey: ["transitions", "current"],
    queryFn: () => api<Transition>("/transitions/current"),
    retry: false,
  });
  const noCurrent =
    currentError instanceof ApiError && currentError.status === 404;

  const { data: history, isPending: historyPending } = useQuery({
    queryKey: ["transitions"],
    queryFn: () => api<Transition[]>("/transitions"),
  });

  function startEdit() {
    if (!current) return;
    setText(current.transition);
    setErr("");
  }

  async function submit() {
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH) {
      setErr(`Transition must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setErr(`Transition must be at most ${MAX_LENGTH} characters.`);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api("/transitions", {
        method: "POST",
        json: { transition: text },
      });
      setText("");
      await qc.invalidateQueries({ queryKey: ["transitions"] });
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await api(`/transitions/${id}`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey: ["transitions"] });
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  const remaining = MAX_LENGTH - text.length;
  const overLimit = text.length > MAX_LENGTH;
  const underLimit = text.trim().length < MIN_LENGTH && text.length > 0;

  return (
    <AppShell>
      <header className="bg-secondary/70 backdrop-blur-md rounded-[20px] px-7 py-7 shadow-[0_16px_40px_-18px_rgba(248,175,166,0.8)]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/70">
          Where you're headed
        </p>
        <h1 className="mt-2 font-display text-4xl">My Transition</h1>
        <p className="mt-2 max-w-lg text-sm text-foreground/75">
          Tell CareerBloom what's next for you so it can tailor its advice.
        </p>
      </header>

      <section className="glass p-7">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55">
          Current transition
        </p>
        {currentPending ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
          </div>
        ) : current ? (
          <div className="mt-4 flex flex-col gap-4 rounded-3xl bg-white/70 p-6">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
              {current.transition}
            </p>
            <div className="flex justify-end">
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            </div>
          </div>
        ) : noCurrent ? (
          <div className="glass mt-4 p-8 text-center text-sm text-foreground/60">
            <Compass className="mx-auto h-6 w-6 text-foreground/40" />
            <p className="mt-3">
              Tell CareerBloom where you're headed so it can tailor its advice.
            </p>
          </div>
        ) : (
          <div className="mt-4 p-8 text-center text-sm text-red-600">
            Couldn't load your transition. Try again in a moment.
          </div>
        )}
      </section>

      <section className="glass p-7 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55">
            {current ? "Update" : "Set"} your transition
          </p>
          <p className="mt-1 text-sm text-foreground/60">
            {MIN_LENGTH}-{MAX_LENGTH} characters. This becomes the current
            transition CareerBloom draws from.
          </p>
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setErr("");
          }}
          rows={6}
          className={`mt-1 w-full resize-none rounded-2xl bg-white/85 p-4 text-sm outline-none focus:ring-2 focus:ring-secondary ${overLimit ? "ring-2 ring-red-400" : ""}`}
          placeholder="e.g. I'm a nurse looking to transition into UX design, focusing on healthcare products."
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`text-xs ${overLimit ? "text-red-600" : underLimit ? "text-amber-600" : "text-foreground/50"}`}
          >
            {text.length}/{MAX_LENGTH}
          </span>
          {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-background disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Compass className="h-4 w-4" />
            )}{" "}
            {busy ? "Saving…" : "Save transition"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Previous transitions</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Past narratives CareerBloom may still draw from.
        </p>
        {historyPending ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {history.map((t) => (
              <article
                key={t.transition_id}
                className="glass flex items-start justify-between gap-4 p-6"
              >
                <div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                    {t.transition}
                  </p>
                  <p className="mt-2 text-xs text-foreground/50">
                    {new Date(t.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => void remove(t.transition_id)}
                  disabled={deleting === t.transition_id}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-foreground/60 hover:bg-white disabled:opacity-50"
                >
                  {deleting === t.transition_id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass mt-4 p-8 text-center text-sm text-foreground/60">
            No previous transitions yet.
          </div>
        )}
      </section>
    </AppShell>
  );
}
