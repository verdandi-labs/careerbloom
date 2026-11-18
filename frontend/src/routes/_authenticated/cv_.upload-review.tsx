import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cv_/upload-review")({
  head: () => ({ meta: [{ title: "Review your CV · careerBloom" }] }),
});
