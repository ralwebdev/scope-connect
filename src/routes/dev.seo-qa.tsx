import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { runDiscoverabilityQA, type CheckGroup, type CheckStatus } from "@/lib/discoverability-qa";

export const Route = createFileRoute("/dev/seo-qa")({
  head: () => ({
    meta: [
      { title: "SEO / AEO / GEO QA — Scope Connect" },
      { name: "description", content: "Internal discoverability validation dashboard." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SeoQaPage,
});

function SeoQaPage() {
  const [robots, setRobots] = useState<string>("");
  useEffect(() => { fetch("/robots.txt").then(r => r.text()).then(setRobots).catch(() => setRobots("")); }, []);
  const { groups, summary } = runDiscoverabilityQA(robots);
  const total = summary.pass + summary.warn + summary.fail;
  return (
    <AppShell>
      <header className="border-b border-border/40 bg-gradient-hero py-10 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">Internal · noindex</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Discoverability QA</h1>
          <p className="mt-2 text-sm text-primary-foreground/75">Non-blocking validation of the additive SEO, AEO and GEO layer. No runtime logic affected.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Stat label="Pass" value={summary.pass} tone="pass" />
            <Stat label="Warn" value={summary.warn} tone="warn" />
            <Stat label="Fail" value={summary.fail} tone="fail" />
            <Stat label="Total" value={total} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {groups.map((g) => <Group key={g.name} group={g} />)}
      </main>
    </AppShell>
  );
}

function Group({ group }: { group: CheckGroup }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-foreground">{group.name}</h2>
      <ul className="mt-3 divide-y divide-border/60">
        {group.checks.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-foreground">{c.label}</div>
              {c.detail && <div className="mt-0.5 text-xs text-muted-foreground">{c.detail}</div>}
            </div>
            <StatusPill status={c.status} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StatusPill({ status }: { status: CheckStatus }) {
  const map = {
    pass: "bg-success/15 text-success",
    warn: "bg-warning/15 text-warning",
    fail: "bg-destructive/15 text-destructive",
  } as const;
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status.toUpperCase()}</span>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "pass" | "warn" | "fail" }) {
  const toneCls = tone === "pass" ? "bg-success/20 text-success" : tone === "warn" ? "bg-warning/20 text-warning" : tone === "fail" ? "bg-destructive/20 text-destructive" : "bg-card/40 text-primary-foreground";
  return <span className={`rounded-full px-3 py-1 font-medium ${toneCls}`}>{label}: {value}</span>;
}
