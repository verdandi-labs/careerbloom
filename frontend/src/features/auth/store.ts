import { create } from "zustand";

interface AuthUIState {
  email: string;
  setEmail: (email: string) => void;
}

export const useAuthUI = create<AuthUIState>((set) => ({
  email: "",
  setEmail: (email) => set({ email }),
}));
