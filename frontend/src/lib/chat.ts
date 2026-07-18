import { api } from "@/lib/api";

export const CAREER_DIRECTION_TITLE = "Career Direction";

export async function createConversation(
  title?: string,
): Promise<string | null> {
  const data = await api<{ id: string }>("/chat/conversations", {
    method: "POST",
    json: { title },
  });
  return data?.id ?? null;
}

export async function getOrCreateCareerDirection(): Promise<string | null> {
  const data = await api<{ id: string }>(
    "/chat/conversations/career-direction",
  );
  return data?.id ?? null;
}
