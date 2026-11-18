import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cv")({
  head: () => ({ meta: [{ title: "My CV · careerBloom" }] }),
});
