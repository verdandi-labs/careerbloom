import { useEffect } from "react";
import { useAuthStore } from "./store";

export function AuthInit({ children }: { children: React.ReactNode }) {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  useEffect(() => { refreshUser(); }, [refreshUser]);
  return <>{children}</>;
}
