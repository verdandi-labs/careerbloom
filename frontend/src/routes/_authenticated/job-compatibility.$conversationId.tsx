import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/job-compatibility/$conversationId",
)({
  head: () => ({ meta: [{ title: "Job Compatibility · careerBloom" }] }),
});
