import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/discoverability/CategoryPage";
import { opportunityDiscovery, MIN_RECORDS } from "@/lib/discoverability";

export const Route = createFileRoute("/opportunities/$domain")({
  head: ({ params }) => {
    const { label, items } = opportunityDiscovery.forSlug(params.domain);
    const title = `${label} Opportunities — Scope Connect`;
    const description = `Internships, co-founder roles and collaborations in ${label.toLowerCase()} from India's campus innovation network.`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: `/opportunities/${params.domain}` },
    ];
    if (items.length < MIN_RECORDS) meta.push({ name: "robots", content: "noindex,follow" });
    return { meta, links: [{ rel: "canonical", href: `/opportunities/${params.domain}` }] };
  },
  component: OpportunityDomainPage,
});

function OpportunityDomainPage() {
  const { domain } = Route.useParams();
  const { label, items } = opportunityDiscovery.forSlug(domain);
  const related = opportunityDiscovery.categories().filter((c) => c.slug !== domain).slice(0, 8);
  return (
    <CategoryPage
      kind="opportunities"
      domainLabel={label}
      domainSlug={domain}
      items={items.map((o) => ({ id: o.id, title: o.title, description: o.description, campus: o.campus, category: o.category }))}
      relatedDomains={related}
      internalLinks={[
        { to: "/projects", label: "Projects" },
        { to: "/challenges", label: "Challenges" },
        { to: "/about", label: "About Scope" },
      ]}
      intro={`Find verified ${label.toLowerCase()} opportunities — collaborations, internships and co-founder roles posted by builders and chapters across India.`}
      faqs={[
        { q: "Are these opportunities verified?", a: "Yes. Every published opportunity is reviewed by Scope moderators before going live." },
        { q: "How do I apply?", a: "Sign in to Scope Connect and open the Opportunities page to mark interest or message the poster." },
        { q: "Can I post an opportunity?", a: "Eligible roles can post opportunities from the Opportunities page after authentication." },
      ]}
    />
  );
}
