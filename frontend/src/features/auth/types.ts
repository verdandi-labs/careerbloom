export interface User {
  user_id: string;
  email: string | null;
  auth_method: "google" | "github";
  onboarding: boolean;
  created_at: string;
}
