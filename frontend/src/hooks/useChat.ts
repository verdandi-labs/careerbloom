import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiStream, errorMessage } from "@/lib/api";

export type MessagePayload = {
  id: string;
  role: string;
  content: string;
  suggestion: unknown;
  applied_text: string | null;
  rejected: boolean;
};

interface UseChatOptions<T> {
  conversationId: string | null;
  greeting: string;
  mapMessage: (payload: MessagePayload) => T;
  onStreamEnd?: (
    lastServerMessage: MessagePayload,
    setMessages: React.Dispatch<React.SetStateAction<T[]>>,
  ) => void;
}

export function useChat<
  T extends { id?: string; role: string; content: string },
>({ conversationId, greeting, mapMessage, onStreamEnd }: UseChatOptions<T>) {
  const [messages, setMessages] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    setLoaded(false);
    setMessages([]);
    setLoadError("");
    (async () => {
      try {
        const msgs = await api<MessagePayload[]>(
          `/chat/conversations/${conversationId}/messages`,
        );
        const loaded: T[] = (msgs ?? []).map(mapMessage);
        if (loaded.length === 0) {
          loaded.push({
            role: "assistant",
            content: greeting,
          } as T);
        }
        setMessages(loaded);
      } catch (e) {
        setLoadError(errorMessage(e, "Couldn't load messages, please refresh"));
      }
      setLoaded(true);
    })();
  }, [conversationId, greeting, mapMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const send = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isStreaming || !conversationId) return;
      setInput("");
      const preSendCount = messages.filter((m) => m.id).length;
      const userMsg = { role: "user", content: msg } as T;
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        const stream = await apiStream(
          `/chat/conversations/${conversationId}/messages`,
          { method: "POST", json: { content: msg } },
        );

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let assistant = "";
        let streamFailed = false;
        setMessages((m) => [...m, { role: "assistant", content: "" } as T]);

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
                  } as T;
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
                  } as T;
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
          const last = msgs[msgs.length - 1];
          if (last?.id) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = mapMessage(last);
              return copy;
            });
            onStreamEnd?.(last, setMessages);
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
          } as T,
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, conversationId, messages, mapMessage, onStreamEnd],
  );

  return {
    messages,
    setMessages,
    input,
    setInput,
    send,
    isStreaming,
    loaded,
    loadError,
    scrollRef,
    inputRef,
  };
}
