import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/career-direction")({
  head: () => ({ meta: [{ title: "My Career Direction · careerBloom" }] }),
});
