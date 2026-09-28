import { Loader2, Send, Sparkles } from "lucide-react";
import { useChat, type MessagePayload } from "@/hooks/useChat";

type BaseMsg = {
  id?: string;
  role: string;
  content: string;
  isError?: boolean;
};

type ChatPanelProps<T extends BaseMsg> = {
  conversationId: string | null;
  context: "cv_chat" | "cover_letter" | "career_direction";
  greeting: string;
  placeholder: string;
  mapMessage: (payload: MessagePayload) => T;
  renderMessageExtra?: (
    msg: T,
    send: (text: string) => void,
  ) => React.ReactNode;
  inputDisabled?: boolean;
  className?: string;
};

export function ChatPanel<T extends BaseMsg>({
  conversationId,
  context,
  greeting,
  placeholder,
  mapMessage,
  renderMessageExtra,
  inputDisabled,
  className,
}: ChatPanelProps<T>) {
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
  } = useChat<T>({
    conversationId,
    context,
    greeting,
    mapMessage,
  });

  return (
    <div className={`flex flex-col min-h-0 ${className ?? ""}`}>
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
              onClick={retry}
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
                  {m.content}
                </div>
              )}
              {m.role === "assistant" && renderMessageExtra?.(m, send)}
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
          disabled={isStreaming || inputDisabled}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-foreground/40 disabled:opacity-60"
          placeholder={placeholder}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim() || inputDisabled}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
