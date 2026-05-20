import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, MapPin, Users, Trophy, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FAQSection, type FAQItem } from "@/components/site/FAQSection";
import { chapterDiscovery } from "@/lib/discoverability";

export const Route = createFileRoute("/chapters/$slug")({
  head: ({ params }) => {
    const record = chapterDiscovery.bySlug(params.slug);
    const name = record?.name ?? params.slug;
    const title = `${name} Chapter — Scope Connect`;
    const description = `${name}'s Scope chapter — active projects, challenges and opportunities run by verified student builders.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/chapters/${params.slug}` },
        ...(record ? [] : [{ name: "robots", content: "noindex,follow" }]),
      ],
      links: [{ rel: "canonical", href: `/chapters/${params.slug}` }],
    };
  },
  loader: ({ params }) => {
    const record = chapterDiscovery.bySlug(params.slug);
    if (!record) throw notFound();
    return { record, activity: chapterDiscovery.activityFor(params.slug) };
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground">Chapter not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This chapter isn't on Scope Connect yet.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild><Link to="/innovation-lab">Innovation Lab</Link></Button>
          <Button asChild variant="outline"><Link to="/contact">Launch a chapter</Link></Button>
        </div>
      </div>
    </AppShell>
  ),
  component: ChapterPage,
});

function ChapterPage() {
  const { record, activity } = Route.useLoaderData();
  const faqs: FAQItem[] = [
    { q: `How do I join the ${record.name} chapter?`, a: "Sign in to Scope Connect and select your institution during onboarding. Your chapter coordinator will verify and onboard you." },
    { q: "What does this chapter do?", a: "Chapters run verified projects, weekly challenges and recruit for opportunities — all governed by Scope's trust-first moderation." },
    { q: "Can I launch a sub-team here?", a: "Yes. Active builders can propose sub-teams via the chapter coordinator after a verified track record on Scope." },
  ];
  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20"><GraduationCap className="mr-1 h-3 w-3" /> Scope Chapter</Badge>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{record.name}</h1>
          {record.chapterName && <p className="mt-1 text-lg text-primary-foreground/80">{record.chapterName}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-primary-foreground/70">
            {record.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {record.city}</span>}
            {typeof record.members === "number" && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {record.members.toLocaleString()} members</span>}
            {typeof record.rank === "number" && <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Rank #{record.rank}</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Active projects" value={activity.stats.projectCount} />
          <Stat label="Live challenges" value={activity.stats.challengeCount} />
          <Stat label="Student participation" value={activity.stats.students} />
        </div>
      </section>

      <ChapterStrip title="Active projects" items={activity.projects.map((p: { title: string; category?: string; cover?: string }) => ({ title: p.title, sub: p.category, cover: p.cover }))} emptyHref="/projects" emptyLabel="Browse all projects" />
      <ChapterStrip title="Active challenges" items={activity.challenges.map((c: { title: string; category?: string; cover?: string }) => ({ title: c.title, sub: c.category, cover: c.cover }))} emptyHref="/challenges" emptyLabel="Browse all challenges" />
      <ChapterStrip title="Opportunities" items={activity.opportunities.map((o: { title: string; category?: string }) => ({ title: o.title, sub: o.category }))} emptyHref="/opportunities" emptyLabel="Browse all opportunities" />

      <FAQSection title={`About ${record.name} on Scope`} items={faqs} />

      <section className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Explore Scope</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { to: "/projects", label: "Projects" },
              { to: "/challenges", label: "Challenges" },
              { to: "/opportunities", label: "Opportunities" },
              { to: "/innovation-lab", label: "Innovation Lab" },
            ].map((l) => (
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </Card>
  );
}

function ChapterStrip({ title, items, emptyHref, emptyLabel }: { title: string; items: { title: string; sub?: string; cover?: string }[]; emptyHref: string; emptyLabel: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Button asChild variant="link" size="sm"><Link to={emptyHref as never}>{emptyLabel} <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
      </div>
      {items.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No activity yet for this chapter. Check back as the chapter ships more work.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((it, i) => (
            <Card key={i} className="p-4 hover-lift">
              <div className="flex items-center justify-between">
                {it.sub && <Badge variant="outline">{it.sub}</Badge>}
                {it.cover && <span className="text-xl">{it.cover}</span>}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{it.title}</h3>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
