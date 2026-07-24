import { create } from "zustand";
import { api, setTokens, clearTokens, isLoggedIn } from "@/lib/api";
import { fetchMe } from "./api";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  login: async (access: string, refresh: string) => {
    setTokens(access, refresh);
    await get().refreshUser();
  },

  logout: () => {
    clearTokens();
    set({ user: null });
  },

  refreshUser: async () => {
    if (!isLoggedIn()) {
      set({ user: null, loading: false, initialized: true });
      return;
    }
    try {
      const user = await fetchMe();
      set({ user, loading: false, initialized: true });
    } catch {
      clearTokens();
      set({ user: null, loading: false, initialized: true });
    }
  },
}));
