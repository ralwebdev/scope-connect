import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";

const TERMS: { term: string; slug: string; definition: string }[] = [
  { term: "Challenge", slug: "challenge", definition: "A practical execution task designed to test learning and applied skills." },
  { term: "Project", slug: "project", definition: "A structured real-world activity where students collaborate and execute outcomes." },
  { term: "Opportunity", slug: "opportunity", definition: "An internship, collaboration or growth pathway available to students." },
  { term: "Chapter", slug: "chapter", definition: "An institution-backed Scope Connect ecosystem." },
  { term: "Proof of work", slug: "proof-of-work", definition: "Evidence of practical execution and contribution." },
  { term: "Institution verification", slug: "institution-verification", definition: "Approval of a student by faculty or institution administrators." },
];

const TITLE = "Glossary — Scope Connect";
const DESCRIPTION = "Canonical definitions of Scope Connect terms: challenge, project, opportunity, chapter, proof of work and institution verification.";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/glossary" },
    ],
    links: [{ rel: "canonical", href: "/glossary" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          name: "Scope Connect Glossary",
          hasDefinedTerm: TERMS.map((t) => ({
            "@type": "DefinedTerm",
            name: t.term,
            description: t.definition,
            termCode: t.slug,
          })),
        }),
      },
    ],
  }),
  component: GlossaryPage,
});

function GlossaryPage() {
  return (
    <AppShell>
      <header className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Glossary</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/75">
            Canonical, plain-English definitions used across the Scope Connect student innovation ecosystem.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <dl className="space-y-4">
          {TERMS.map((t) => (
            <Card key={t.slug} id={t.slug} className="p-5">
              <dt className="text-lg font-semibold text-foreground">{t.term}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{t.definition}</dd>
            </Card>
          ))}
        </dl>
      </main>
    </AppShell>
  );
}
