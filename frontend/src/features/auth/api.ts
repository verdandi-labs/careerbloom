import { api } from "@/lib/api";
import type { User } from "./types";

export function fetchMe(): Promise<User> {
  return api<User>("/auth/me");
}

export function completeOnboarding(): Promise<User> {
  return api<User>("/auth/complete-onboarding", { method: "POST" });
}
