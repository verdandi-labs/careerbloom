import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchMe, sessionKeys } from "@/features/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: sessionKeys.all,
        queryFn: fetchMe,
        retry: false,
        staleTime: 5 * 60 * 1000,
      });
    } catch {
      throw redirect({ to: "/auth", search: {} });
    }
  },
  component: () => <Outlet />,
});
