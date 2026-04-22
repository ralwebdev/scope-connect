import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, TrendingUp, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/site/AppShell";
import { topBuilders, topChapters, campusPartners } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboards")({
  head: () => ({
    meta: [
      { title: "Leaderboards — Scope Connect" },
      { name: "description", content: "Top members, chapters, and campuses on Scope Connect." },
    ],
  }),
  component: LeaderboardsPage,
});

const tabs = ["Members", "Chapters", "Campuses"] as const;
type Tab = (typeof tabs)[number];

function LeaderboardsPage() {
  const [tab, setTab] = useState<Tab>("Members");

  return (
    <AppShell>
      <section className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20"><Trophy className="mr-1 h-3 w-3" /> Live rankings</Badge>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Leaderboards</h1>
          <p className="mt-2 max-w-xl text-primary-foreground/70">
            Updated in real time. Earn points by shipping projects, attending events, and growing your chapter.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex rounded-xl bg-secondary p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
                tab === t ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "Members" && <MembersBoard />}
          {tab === "Chapters" && <ChaptersBoard />}
          {tab === "Campuses" && <CampusesBoard />}
        </div>
      </section>
    </AppShell>
  );
}

function Podium({ items }: { items: { name: string; sub: string; value: string }[] }) {
  const order = [1, 0, 2]; // 2nd, 1st, 3rd
  const heights = ["h-32", "h-40", "h-28"];
  const colors = ["bg-secondary", "bg-gradient-brand text-brand-foreground", "bg-secondary"];

  return (
    <div className="mb-8 grid grid-cols-3 items-end gap-3">
      {order.map((idx, pos) => {
        const it = items[idx];
        if (!it) return <div key={pos} />;
        return (
          <div key={pos} className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-hero text-lg font-bold text-primary-foreground">
              {it.name.charAt(0)}
            </div>
            <div className="mt-2 truncate text-sm font-semibold text-foreground">{it.name}</div>
            <div className="truncate text-xs text-muted-foreground">{it.sub}</div>
            <div className={cn("mt-2 flex items-end justify-center rounded-t-xl text-sm font-bold", heights[pos], colors[pos])}>
              <div className="pb-3">
                {idx === 0 && <Crown className="mx-auto mb-1 h-4 w-4" />}
                #{idx + 1}
                <div className="text-xs opacity-80">{it.value}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MembersBoard() {
  return (
    <>
      <Podium items={topBuilders.map((b) => ({ name: b.name, sub: b.campus, value: `${b.points} pts` }))} />
      <Card className="divide-y divide-border">
        {topBuilders.map((b, i) => (
          <div key={b.name} className="flex items-center gap-4 p-4">
            <div className="w-8 text-center text-sm font-bold text-muted-foreground">#{i + 1}</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
              {b.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.campus} · {b.level}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-foreground">{b.points.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">points</div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

function ChaptersBoard() {
  return (
    <>
      <Podium items={topChapters.map((c) => ({ name: c.name, sub: c.campus, value: `${c.members} members` }))} />
      <Card className="divide-y divide-border">
        {topChapters.map((c) => (
          <div key={c.name} className="flex items-center gap-4 p-4">
            <div className="w-8 text-center text-sm font-bold text-muted-foreground">#{c.rank}</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero text-xs font-bold text-primary-foreground">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.campus}</div>
            </div>
            <div className="hidden text-sm text-muted-foreground sm:block">{c.members} members</div>
            <Badge className="bg-success/15 text-success hover:bg-success/20"><TrendingUp className="mr-1 h-3 w-3" />{c.growth}</Badge>
          </div>
        ))}
      </Card>
    </>
  );
}

function CampusesBoard() {
  const sorted = [...campusPartners].sort((a, b) => b.members - a.members);
  return (
    <>
      <Podium items={sorted.map((c) => ({ name: c.name, sub: c.city, value: `${c.members}` }))} />
      <Card className="divide-y divide-border">
        {sorted.map((c, i) => (
          <div key={c.name} className="flex items-center gap-4 p-4">
            <div className="w-8 text-center text-sm font-bold text-muted-foreground">#{i + 1}</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-cyan text-xs font-bold text-cyan-foreground">
              {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.city}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-foreground">{c.members}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">members</div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
