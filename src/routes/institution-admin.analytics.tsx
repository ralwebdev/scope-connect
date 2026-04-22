import { createFileRoute } from "@tanstack/react-router";
import { Route as Parent } from "./institution-admin";

export const Route = createFileRoute("/institution-admin/analytics")({
  head: () => ({ meta: [{ title: "Institution Analytics · Scope Connect" }, { name: "robots", content: "noindex" }] }),
  component: Parent.options.component,
});
