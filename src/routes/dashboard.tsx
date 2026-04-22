import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy,
  Flame,
  TrendingUp,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/site/AppShell";
import { upcomingEvents, feedPosts, topBuilders } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Scope Connect" },
      { name: "description", content: "Your Scope Connect builder dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const me = {
    name: "Aarav Mehta",
    campus: "IIT Bombay",
    level: "Innovator",
    points: 4820,
    nextLevel: "Leader",
    progress: 72,
    rank: 14,
  };

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-10 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-2xl font-bold text-brand-foreground shadow-brand">
              {me.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, {me.name.split(" ")[0]} 👋</h1>
              <p className="text-sm text-primary-foreground/70">{me.campus} · {me.level}</p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-primary-foreground/60">Scope Points</div>
                <div className="text-2xl font-bold">{me.points.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-primary-foreground/60">National Rank</div>
                <div className="text-2xl font-bold">#{me.rank}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile strength */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Profile strength</h3>
              <Target className="h-4 w-4 text-brand" />
            </div>
            <div className="mt-4 text-3xl font-bold text-foreground">82%</div>
            <Progress value={82} className="mt-3" />
            <p className="mt-3 text-xs text-muted-foreground">Add a portfolio link & 1 project to reach 100%.</p>
          </Card>

          {/* Level progress */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Next level: {me.nextLevel}</h3>
              <Sparkles className="h-4 w-4 text-cyan" />
            </div>
            <div className="mt-4 text-3xl font-bold text-foreground">{me.progress}%</div>
            <Progress value={me.progress} className="mt-3" />
            <p className="mt-3 text-xs text-muted-foreground">680 points to unlock Leader-tier perks.</p>
          </Card>

          {/* Streak */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Login streak</h3>
              <Flame className="h-4 w-4 text-brand" />
            </div>
            <div className="mt-4 text-3xl font-bold text-foreground">12 days 🔥</div>
            <p className="mt-3 text-xs text-muted-foreground">+50 points awarded today. Don't break the streak!</p>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent feed */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h3 className="font-semibold text-foreground">Recent feed</h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/feed">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {feedPosts.slice(0, 3).map((p) => (
                <div key={p.id} className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
                      {p.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{p.author}</div>
                      <div className="text-xs text-muted-foreground">{p.campus} · {p.time}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{p.type}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-foreground/90">{p.content}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Upcoming events</h3>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <ul className="mt-4 space-y-3">
                {upcomingEvents.slice(0, 3).map((e) => (
                  <li key={e.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-brand-foreground">
                      {e.date.split(" ")[1] ?? e.date}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.venue}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Recommended collabs</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <ul className="mt-4 space-y-3">
                {topBuilders.slice(0, 4).map((b) => (
                  <li key={b.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                      {b.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{b.campus}</div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs">Connect</Button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-gradient-hero p-5 text-primary-foreground">
              <Trophy className="h-5 w-5 text-cyan" />
              <h3 className="mt-3 font-semibold">Leaderboard position</h3>
              <p className="mt-1 text-sm text-primary-foreground/70">You're #{me.rank} in the national leaderboard.</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-cyan">
                <TrendingUp className="h-3.5 w-3.5" /> +6 spots this week
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/leaderboards">View leaderboards</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
