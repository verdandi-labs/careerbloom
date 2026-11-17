import { api } from "@/lib/api";

export type Feature =
  "cv_chat" | "cover_letter" | "career_direction" | "job_compatibility";

export type ConversationSummary = {
  id: string;
  title: string;
  feature: Feature;
  created_at: string;
};

export async function listConversations(
  feature: Feature,
): Promise<ConversationSummary[]> {
  return api<ConversationSummary[]>(`/chat/${feature}/conversations`);
}

export async function createConversation(
  feature: Feature,
  title?: string,
): Promise<string | null> {
  const data = await api<{ id: string }>(`/chat/${feature}/conversations`, {
    method: "POST",
    json: { title },
  });
  return data?.id ?? null;
}

export async function deleteConversation(id: string): Promise<void> {
  await api(`/chat/conversations/${id}`, { method: "DELETE" });
}

export async function createCoverLetterConversation(): Promise<string | null> {
  return createConversation("cover_letter");
}

export async function listCoverLetterConversations(): Promise<
  ConversationSummary[]
> {
  return listConversations("cover_letter");
}

export async function getOrCreateCareerDirection(): Promise<string | null> {
  const conversations = await listConversations("career_direction");
  const existing = conversations[0];
  if (existing) return existing.id;
  return createConversation("career_direction");
}

export type ModelInfo = {
  id: string;
  display_name: string;
};

export type ModelProvider = {
  name: string;
  default: string;
  models: ModelInfo[];
};

export type ModelsResponse = {
  providers: ModelProvider[];
};

export async function getModels(): Promise<ModelsResponse> {
  return api<ModelsResponse>("/models");
}
