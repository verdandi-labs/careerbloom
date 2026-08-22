import { api } from "@/lib/api";
import type { User } from "./types";

export function fetchMe(): Promise<User> {
  return api<User>("/auth/me");
}

export function requestMagicLink(email: string): Promise<void> {
  return api("/auth/magic-link", { method: "POST", json: { email } });
}

export function completeOnboarding(): Promise<User> {
  return api<User>("/auth/complete-onboarding", { method: "POST" });
}
