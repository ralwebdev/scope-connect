import { createFileRoute } from "@tanstack/react-router";
import { Users, Trophy, TrendingUp, Rocket, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/site/AppShell";
import { campusPartners, topBuilders, feedPosts, upcomingEvents } from "@/lib/mock-data";

export const Route = createFileRoute("/campus")({
  head: () => ({
    meta: [
      { title: "Campus Hub — Scope Connect" },
      { name: "description", content: "Your campus's home on Scope Connect — leaders, projects, events & rank." },
    ],
  }),
  component: CampusHub,
});

function CampusHub() {
  const campus = campusPartners[0];

  return (
    <AppShell>
      {/* Hero */}
      <section className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">Campus Hub</Badge>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{campus.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-primary-foreground/70">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {campus.city}</span>
            <span>·</span>
            <span>Campus Rank #1 in India</span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[
              { l: "Active members", v: campus.members.toLocaleString(), i: Users },
              { l: "Leaders", v: "18", i: Trophy },
              { l: "Projects shipped", v: "124", i: Rocket },
              { l: "Weekly growth", v: "+12%", i: TrendingUp },
            ].map(({ l, v, i: Icon }) => (
              <Card key={l} className="border-primary-foreground/10 bg-primary-foreground/5 p-5 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-primary-foreground/60">{l}</span>
                  <Icon className="h-4 w-4 text-cyan" />
                </div>
                <div className="mt-2 text-2xl font-bold">{v}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active members */}
          <Card className="lg:col-span-2">
            <div className="border-b border-border p-5">
              <h3 className="font-semibold text-foreground">Top builders on campus</h3>
            </div>
            <div className="divide-y divide-border">
              {topBuilders.map((b, i) => (
                <div key={b.name} className="flex items-center gap-4 p-5">
                  <div className="w-6 text-sm font-bold text-muted-foreground">#{i + 1}</div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
                    {b.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.level}</div>
                  </div>
                  <Badge variant="outline">{b.points.toLocaleString()} pts</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground">Campus events</h3>
              <ul className="mt-4 space-y-3">
                {upcomingEvents.slice(0, 3).map((e) => (
                  <li key={e.title} className="rounded-lg border border-border p-3">
                    <Badge className="text-xs">{e.type}</Badge>
                    <div className="mt-2 text-sm font-semibold text-foreground">{e.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {e.date}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-foreground">Other top campuses</h3>
              <ul className="mt-4 space-y-3">
                {campusPartners.slice(1, 6).map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 2}</span>
                      <span className="font-medium text-foreground">{c.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.members}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">Campus feed</h3>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {feedPosts.slice(0, 4).map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
                    {p.author.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{p.author}</div>
                    <div className="text-xs text-muted-foreground">{p.time}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">{p.type}</Badge>
                </div>
                <p className="mt-3 text-sm text-foreground/90">{p.content}</p>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>♥ {p.likes}</span>
                  <span>🎉 {p.celebrates}</span>
                  <span>💬 {p.comments}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
