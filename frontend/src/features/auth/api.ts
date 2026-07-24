import { api } from "@/lib/api";
import type { User } from "./types";

export function fetchMe(): Promise<User> {
  return api<User>("/auth/me");
}

export function requestMagicLink(email: string): Promise<void> {
  return api("/auth/magic-link", { method: "POST", json: { email } });
}

export function loginWithPassword(email: string, password: string): Promise<{ access_token: string }> {
  return api("/auth/login", { method: "POST", json: { email, password } });
}

export function setPassword(email: string, password: string): Promise<{ access_token: string; email: string }> {
  return api("/auth/password", { method: "POST", json: { email, password } });
}

export function verifyMagicLink(token: string, email: string): Promise<void> {
  return api(`/auth/magic?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
}
