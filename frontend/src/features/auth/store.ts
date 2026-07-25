import { create } from "zustand";

interface AuthUIState {
  mode: "magic-link" | "login";
  email: string;
  setMode: (mode: "magic-link" | "login") => void;
  setEmail: (email: string) => void;
}

export const useAuthUI = create<AuthUIState>((set) => ({
  mode: "magic-link",
  email: "",
  setMode: (mode) => set({ mode }),
  setEmail: (email) => set({ email }),
}));
