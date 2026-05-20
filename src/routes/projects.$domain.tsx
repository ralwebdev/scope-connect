import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/discoverability/CategoryPage";
import { projectDiscovery, MIN_RECORDS } from "@/lib/discoverability";

export const Route = createFileRoute("/projects/$domain")({
  head: ({ params }) => {
    const { label, items } = projectDiscovery.forSlug(params.domain);
    const title = `${label} Projects — Scope Connect`;
    const description = `Verified ${label.toLowerCase()} projects shipped by student builders across India's campus innovation network.`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: `/projects/${params.domain}` },
    ];
    if (items.length < MIN_RECORDS) meta.push({ name: "robots", content: "noindex,follow" });
    return { meta, links: [{ rel: "canonical", href: `/projects/${params.domain}` }] };
  },
  component: ProjectDomainPage,
});

function ProjectDomainPage() {
  const { domain } = Route.useParams();
  const { label, items } = projectDiscovery.forSlug(domain);
  const related = projectDiscovery.categories().filter((c) => c.slug !== domain).slice(0, 8);
  return (
    <CategoryPage
      kind="projects"
      domainLabel={label}
      domainSlug={domain}
      items={items.map((p) => ({ id: p.id, title: p.title, description: p.description, cover: p.cover, campus: p.campus, category: p.category }))}
      relatedDomains={related}
      internalLinks={[
        { to: "/challenges", label: "Challenges" },
        { to: "/opportunities", label: "Opportunities" },
        { to: "/innovation-lab", label: "Innovation Lab" },
        { to: "/about", label: "About Scope" },
      ]}
      intro={`Browse ${label.toLowerCase()} projects shipped on Scope Connect. Every project is created by verified student builders and reviewed before publishing.`}
      faqs={[
        { q: `What counts as a ${label.toLowerCase()} project?`, a: `Any moderated, proof-of-work project tagged under ${label} that has completed Scope's governance review.` },
        { q: "Can I start a project here?", a: "Yes — sign in, draft a project from the Projects page, and submit it for moderation." },
        { q: "Are these projects verified?", a: "Yes. Every published project passes Scope's trust-first moderation pipeline before going live." },
      ]}
    />
  );
}
