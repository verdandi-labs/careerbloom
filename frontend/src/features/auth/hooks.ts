import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fetchMe } from "./api";

export const sessionKeys = {
  all: ["session"] as const,
};

export function useSession() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    qc.clear();
  };
}
