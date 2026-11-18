import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cv-chat")({
  head: () => ({ meta: [{ title: "CV Chat · careerBloom" }] }),
});
