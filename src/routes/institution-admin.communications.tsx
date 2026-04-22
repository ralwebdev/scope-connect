import { createFileRoute } from "@tanstack/react-router";
import { Route as Parent } from "./institution-admin";

export const Route = createFileRoute("/institution-admin/communications")({
  head: () => ({ meta: [{ title: "Institution Communications · Scope Connect" }, { name: "robots", content: "noindex" }] }),
  component: Parent.options.component,
});
