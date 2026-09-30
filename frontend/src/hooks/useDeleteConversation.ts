import { useState } from "react";
import { deleteConversation } from "@/lib/chat";
import { errorMessage } from "@/lib/api";

export function useDeleteConversation<T extends { id: string }>({
  items,
  setItems,
  onBeforeDelete,
  onSuccess,
  onError,
}: {
  items: T[];
  setItems: (items: T[]) => void;
  onBeforeDelete?: (id: string) => void;
  onSuccess?: (id: string) => void;
  onError?: (id: string, message: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function confirmDelete(id: string) {
    const snapshot = items.find((c) => c.id === id);
    setItems(items.filter((c) => c.id !== id));
    setDeletingId(null);
    onBeforeDelete?.(id);
    try {
      await deleteConversation(id);
      onSuccess?.(id);
    } catch (e) {
      if (snapshot) setItems([...items, snapshot]);
      onError?.(
        id,
        errorMessage(e, "Couldn't delete conversation, please try again"),
      );
    }
  }

  return { deletingId, setDeletingId, confirmDelete };
}
