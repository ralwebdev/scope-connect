import { createFileRoute } from "@tanstack/react-router";
import { Route as Parent } from "./institution-admin";

export const Route = createFileRoute("/institution-admin/members")({
  head: () => ({ meta: [{ title: "Institution Members · Scope Connect" }, { name: "robots", content: "noindex" }] }),
  component: Parent.options.component,
});
