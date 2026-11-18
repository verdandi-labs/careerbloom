import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cv-editor")({
  head: () => ({ meta: [{ title: "CV Builder · careerBloom" }] }),
});
