import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/discoverability/CategoryPage";
import { challengeDiscovery, MIN_RECORDS } from "@/lib/discoverability";

export const Route = createFileRoute("/challenges/$domain")({
  head: ({ params }) => {
    const { label, items } = challengeDiscovery.forSlug(params.domain);
    const title = `${label} Challenges — Scope Connect`;
    const description = `Curated ${label.toLowerCase()} challenges with XP, mentor access and proof-of-work rewards for student builders.`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: `/challenges/${params.domain}` },
    ];
    if (items.length < MIN_RECORDS) meta.push({ name: "robots", content: "noindex,follow" });
    return { meta, links: [{ rel: "canonical", href: `/challenges/${params.domain}` }] };
  },
  component: ChallengeDomainPage,
});

function ChallengeDomainPage() {
  const { domain } = Route.useParams();
  const { label, items } = challengeDiscovery.forSlug(domain);
  const related = challengeDiscovery.categories().filter((c) => c.slug !== domain).slice(0, 8);
  return (
    <CategoryPage
      kind="challenges"
      domainLabel={label}
      domainSlug={domain}
      items={items.map((c) => ({ id: c.id, title: c.title, description: c.description, cover: c.cover, campus: c.campus, category: c.category }))}
      relatedDomains={related}
      internalLinks={[
        { to: "/projects", label: "Projects" },
        { to: "/opportunities", label: "Opportunities" },
        { to: "/innovation-lab", label: "Innovation Lab" },
      ]}
      intro={`Take on ${label.toLowerCase()} challenges curated by Scope. Earn XP, build proof of work and grow your verified portfolio.`}
      faqs={[
        { q: `Who can apply to ${label.toLowerCase()} challenges?`, a: "Any verified student builder on Scope Connect. Sign in to apply and track progress." },
        { q: "How are challenges moderated?", a: "Every challenge is reviewed before publishing. Submissions are evaluated via proof-of-work, not self-reported claims." },
        { q: "Do challenges count toward my portfolio?", a: "Yes. Completed challenges are added to your Scope portfolio with verification status." },
      ]}
    />
  );
}
