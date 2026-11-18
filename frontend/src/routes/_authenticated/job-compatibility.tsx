import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/job-compatibility")({
  head: () => ({ meta: [{ title: "Job Compatibility · careerBloom" }] }),
});
