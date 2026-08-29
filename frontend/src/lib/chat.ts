import { api } from "@/lib/api";

export type ConversationSummary = {
  id: string;
  title: string;
  is_cover_letter: boolean;
  language: string | null;
  created_at: string;
};

export async function createConversation(
  title?: string,
): Promise<string | null> {
  const data = await api<{ id: string }>("/chat/conversations", {
    method: "POST",
    json: { title },
  });
  return data?.id ?? null;
}

export async function createCoverLetterConversation(
  language: string,
): Promise<string | null> {
  const data = await api<{ id: string }>("/chat/cover-letter-conversations", {
    method: "POST",
    json: { language },
  });
  return data?.id ?? null;
}

export async function listCoverLetterConversations(): Promise<
  ConversationSummary[]
> {
  return api<ConversationSummary[]>("/chat/cover-letter-conversations");
}

export async function getOrCreateCareerDirection(): Promise<string | null> {
  const data = await api<{ id: string }>(
    "/chat/conversations/career-direction",
  );
  return data?.id ?? null;
}
