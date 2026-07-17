import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (!isLoggedIn()) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
