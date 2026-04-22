import { createFileRoute } from "@tanstack/react-router";
import { Bell, Trophy, Sparkles, Zap, Users, Heart, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/site/AppShell";
import { AuthGate } from "@/components/site/AuthGate";
import { useNotifications, useUnreadNotifications } from "@/hooks/use-scope";
import { notifications } from "@/lib/scope-store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Scope Connect" },
      { name: "description", content: "Your activity, ranks, and chapter alerts in one place." },
      { property: "og:title", content: "Notifications — Scope Connect" },
      { property: "og:description", content: "Your activity, ranks, and chapter alerts in one place." },
    ],
  }),
  component: () => <AuthGate><NotificationsPage /></AuthGate>,
});

const ICONS = { trophy: Trophy, spark: Sparkles, zap: Zap, users: Users, heart: Heart } as const;

function timeAgo(at: number) {
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationsPage() {
  const list = useNotifications();
  const unread = useUnreadNotifications();

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20"><Bell className="mr-1 h-3 w-3" /> Activity Center</Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Notifications</h1>
            <p className="mt-2 text-primary-foreground/70">{unread > 0 ? `${unread} fresh signal${unread === 1 ? "" : "s"} for you.` : "You're all caught up."}</p>
          </div>
          {unread > 0 && (
            <Button onClick={() => notifications.markAllRead()} variant="secondary" size="sm">
              <Check className="mr-1.5 h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-semibold text-foreground">No alerts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Make moves and they'll appear here.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {list.map((n) => {
              const Icon = ICONS[n.icon] ?? Sparkles;
              return (
                <Card key={n.id} className={`flex items-start gap-3 p-4 hover-lift animate-fade-in ${!n.read ? "border-brand/40 bg-brand/5" : ""}`}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{n.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-brand animate-pulse" />}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
