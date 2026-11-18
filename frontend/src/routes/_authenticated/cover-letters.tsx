import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cover-letters")({
  head: () => ({ meta: [{ title: "Cover Letters · careerBloom" }] }),
});
