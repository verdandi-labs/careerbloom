import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clearTokens } from "@/lib/api";
import { fetchMe, requestMagicLink } from "./api";

export const sessionKeys = {
  all: ["session"] as const,
};

export function useSession() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: fetchMe,
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSendMagicLink() {
  return useMutation({ mutationFn: requestMagicLink });
}

export function useSignOut() {
  const qc = useQueryClient();
  return () => {
    clearTokens();
    if (!localStorage.getItem("remember_email")) {
      localStorage.removeItem("auth_email");
    }
    qc.clear();
  };
}
