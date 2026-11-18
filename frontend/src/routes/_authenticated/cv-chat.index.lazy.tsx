import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/cv-chat/")({
  component: () => (
    <section className="glass grid place-items-center p-10 text-sm text-foreground/60">
      Opening your last conversation…
    </section>
  ),
});
