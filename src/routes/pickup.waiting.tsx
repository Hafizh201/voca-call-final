import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pickup/waiting")({
  beforeLoad: () => {
    throw redirect({ to: "/monitoring" });
  },
  component: () => null,
});
