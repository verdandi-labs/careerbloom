import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "careerBloom — Your AI Career Companion" },
      {
        name: "description",
        content: "AI-powered CV and career transition companion.",
      },
    ],
  }),
});
