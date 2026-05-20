import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/site/AppShell";
import { FAQSection, type FAQItem } from "@/components/site/FAQSection";
import { MIN_RECORDS } from "@/lib/discoverability";

type Item = { id?: string; title: string; description?: string; cover?: string; campus?: string; category?: string };

interface CategoryPageProps {
  kind: "projects" | "challenges" | "opportunities";
  domainLabel: string;
  domainSlug: string;
  items: Item[];
  relatedDomains: { slug: string; label: string; count: number }[];
  internalLinks: { to: string; label: string }[];
  faqs: FAQItem[];
  intro: string;
}

export function CategoryPage({ kind, domainLabel, items, relatedDomains, internalLinks, faqs, intro }: CategoryPageProps) {
  const empty = items.length < MIN_RECORDS;
  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">
            <Sparkles className="mr-1 h-3 w-3" /> {kind === "projects" ? "Project domain" : kind === "challenges" ? "Challenge track" : "Opportunity track"}
          </Badge>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{domainLabel} {kind}</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/75">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {empty ? (
          <Card className="p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground">No verified {domainLabel.toLowerCase()} {kind} yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Relevant projects, challenges or opportunities will appear here as activity grows.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button asChild size="sm" variant="outline"><Link to={`/${kind}`}>Browse all {kind}</Link></Button>
              <Button asChild size="sm"><Link to="/innovation-lab">Visit Innovation Lab</Link></Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <Card key={it.id ?? i} className="flex flex-col p-5 hover-lift">
                <div className="flex items-center justify-between">
                  {it.category && <Badge variant="outline">{it.category}</Badge>}
                  {it.cover && <span className="text-2xl">{it.cover}</span>}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{it.title}</h3>
                {it.description && <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{it.description}</p>}
                {it.campus && <div className="mt-3 text-xs text-muted-foreground">{it.campus}</div>}
              </Card>
            ))}
          </div>
        )}
      </section>

      {relatedDomains.length > 0 && (
        <section className="border-t border-border/40 bg-muted/30 py-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-foreground">Related {kind} domains</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedDomains.map((d) => (
                <Link key={d.slug} to={`/${kind}/${d.slug}` as never} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent">
                  {d.label} <span className="text-muted-foreground">· {d.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <FAQSection title={`About ${domainLabel} ${kind}`} items={faqs} />

      <section className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Explore more</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {internalLinks.map((l) => (
              <Button key={l.to} asChild variant="outline" size="sm">
                <Link to={l.to as never}>{l.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
