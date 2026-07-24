export interface User {
  id: string;
  display_name: string | null;
  onboarding_complete: boolean;
  preferred_language: string;
  cv_template: string;
}
