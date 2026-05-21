import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Plus, Sparkles, ShieldCheck, MapPin, Building2, Crown } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStoreValue } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import { opportunityEngine, type Opportunity } from "@/lib/opportunity-engine-store";

export const Route = createFileRoute("/opportunities-hub")({
  head: () => ({
    meta: [
      { title: "Opportunity Hub — Scope Connect" },
      { name: "description", content: "Merit-based opportunities with eligibility scoring, recruiter trust signals and anti-abuse controls." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: OpportunityHubListPage,
});

function OpportunityHubListPage() {
  const role = useRole();
  const list = useStoreValue(() => opportunityEngine.opportunities.listPublic());
  const canCreate = opportunityEngine.canCreateOpportunity(role);

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">
              <Sparkles className="mr-1 h-3 w-3" /> Opportunity Engine · Additive
            </Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Opportunity Hub
            </h1>
            <p className="mt-2 max-w-2xl text-primary-foreground/70">
              Merit-based internships, leadership roles, research and recruitment with reliability-gated eligibility.
            </p>
          </div>
          {canCreate && (
            <Button asChild className="bg-gradient-brand text-brand-foreground">
              <Link to="/opportunities-hub/new"><Plus className="mr-2 h-4 w-4" /> Create opportunity</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No opportunities yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              The Opportunity Hub surfaces merit-gated roles. Institution admins can publish opportunities with eligibility thresholds.
            </p>
            {canCreate && (
              <Button asChild className="mt-2">
                <Link to="/opportunities-hub/new"><Plus className="mr-2 h-4 w-4" /> Create the first opportunity</Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(o => <OpportunityTile key={o.id} o={o} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function OpportunityTile({ o }: { o: Opportunity }) {
  return (
    <Card className="flex flex-col gap-3 p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className="capitalize">{o.opportunityType.replace(/_/g, " ")}</Badge>
        {o.isPremium && (
          <Badge className="bg-gradient-brand text-brand-foreground">
            <Crown className="mr-1 h-3 w-3" /> Premium
          </Badge>
        )}
      </div>
      <div>
        <h3 className="line-clamp-2 text-lg font-semibold">{o.opportunityTitle}</h3>
        {o.organizationName && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" /> {o.organizationName}
          </p>
        )}
      </div>
      <p className="line-clamp-3 text-sm text-muted-foreground">{o.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {o.mode && (
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {o.mode}{o.location ? ` · ${o.location}` : ""}</span>
        )}
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Reliability ≥ {o.minimumReliabilityScore}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground capitalize">{o.status.replace(/_/g, " ")}</span>
        <Button asChild size="sm" variant="outline">
          <Link to="/opportunities-hub/$opportunityId" params={{ opportunityId: o.id }}>View</Link>
        </Button>
      </div>
    </Card>
  );
}
