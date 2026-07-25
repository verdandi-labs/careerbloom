import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isLoggedIn, setTokens, clearTokens } from "@/lib/api";
import {
  fetchMe,
  loginWithPassword,
  requestMagicLink,
  setPassword,
} from "./api";

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

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginWithPassword(email, password),
    onSuccess: (data) => {
      setTokens(data.access_token, "");
      qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useSendMagicLink() {
  return useMutation({ mutationFn: requestMagicLink });
}

export function useSetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      setPassword(email, password),
    onSuccess: (data) => {
      setTokens(data.access_token, "");
      qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return () => {
    clearTokens();
    qc.setQueryData(sessionKeys.all, null);
  };
}
