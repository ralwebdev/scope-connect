import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, Database, Megaphone, Users, BarChart3, AlertTriangle, Trash2, RefreshCw, Plus } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-scope";
import { curated, applications, ideaSubmissions, feed, projects, notifications, meta } from "@/lib/scope-store";
import { toast } from "sonner";

const ADMIN_EMAILS = ["admin@scope.in", "team@scope.in", "founder@scope.in"];

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Scope Connect" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Tab = "overview" | "projects" | "content" | "broadcast" | "moderation";

function AdminPage() {
  const user = useUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    try { if (sessionStorage.getItem("scope_admin_unlocked") === "1") setUnlocked(true); } catch { /* noop */ }
  }, []);

  const isAdminEmail = !!user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Three ways to access: admin email, "scope2026" pin, or already-unlocked session
  const tryUnlock = () => {
    if (pin === "scope2026" || isAdminEmail) {
      try { sessionStorage.setItem("scope_admin_unlocked", "1"); } catch { /* noop */ }
      setUnlocked(true);
      toast.success("Admin mode unlocked");
    } else {
      toast.error("Invalid pin");
    }
  };

  if (!unlocked && !isAdminEmail) {
    return (
      <AppShell>
        <section className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
          <Card className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-brand"><Shield className="h-6 w-6" /></div>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Scope Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Restricted area. Authorized team members only.</p>
            <div className="mt-5 space-y-3">
              <div>
                <Label htmlFor="pin">Admin PIN</Label>
                <Input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="mt-1.5" placeholder="••••••••" />
              </div>
              <Button onClick={tryUnlock} className="w-full bg-gradient-brand text-brand-foreground">Unlock</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
            </div>
          </Card>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-8 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div>
            <Badge className="bg-cyan/15 text-cyan"><Shield className="mr-1 h-3 w-3" /> Admin Console</Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Scope Operations</h1>
          </div>
          <Button variant="outline" size="sm" className="border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground" onClick={() => { try { sessionStorage.removeItem("scope_admin_unlocked"); } catch { /* noop */ } setUnlocked(false); }}>Lock</Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {([
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "projects", label: "Projects CMS", icon: Database },
            { id: "content", label: "Content", icon: Users },
            { id: "broadcast", label: "Broadcast", icon: Megaphone },
            { id: "moderation", label: "Moderation", icon: AlertTriangle },
          ] as { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "overview" && <Overview />}
          {tab === "projects" && <ProjectsCMS />}
          {tab === "content" && <ContentManager />}
          {tab === "broadcast" && <BroadcastTab />}
          {tab === "moderation" && <ModerationTab />}
        </div>
      </section>
    </AppShell>
  );
}

function Overview() {
  const stats = useMemo(() => ({
    apps: applications.all().length,
    ideas: ideaSubmissions.all().length,
    posts: feed.all().length,
    userProjects: projects.all().filter((p) => !p.id.startsWith("seed_")).length,
    visits: meta.visits(),
    unread: notifications.unread(),
    challenges: curated.scopeChallenges().length,
    waitlist: safeCount("scope_waitlist"),
    feedback: safeCount("scope_feedback"),
    ambassadors: safeCount("scope_ambassador_apps"),
  }), []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Applications" value={stats.apps} />
      <Stat label="Idea submissions" value={stats.ideas} />
      <Stat label="Feed posts" value={stats.posts} />
      <Stat label="User projects" value={stats.userProjects} />
      <Stat label="Live challenges" value={stats.challenges} />
      <Stat label="Waitlist signups" value={stats.waitlist} />
      <Stat label="Feedback entries" value={stats.feedback} />
      <Stat label="Ambassador applications" value={stats.ambassadors} />
      <Stat label="Visits (this device)" value={stats.visits} />
      <Stat label="Unread notifications" value={stats.unread} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5 hover-lift">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
    </Card>
  );
}

function safeCount(key: string): number {
  if (typeof window === "undefined") return 0;
  try { return (JSON.parse(localStorage.getItem(key) || "[]") as unknown[]).length; } catch { return 0; }
}

function ProjectsCMS() {
  const all = curated.all();
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-secondary/30 p-4">
        <div className="text-sm font-semibold text-foreground">All curated projects ({all.length})</div>
        <div className="text-xs text-muted-foreground">Read-only in this build. Backend CMS ships in v2.</div>
      </div>
      <div className="divide-y divide-border">
        {all.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-2xl">{p.cover}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.scope} · {p.category} · {p.seatsFilled}/{p.seatsTotal} seats · {p.status}</div>
            </div>
            <Badge variant="outline" className="text-xs">{p.difficulty}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ContentManager() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Homepage stats</h3>
        <p className="mt-1 text-xs text-muted-foreground">Defined in <code className="rounded bg-secondary px-1">src/lib/mock-data.ts</code> · liveMetrics.</p>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Testimonials</h3>
        <p className="mt-1 text-xs text-muted-foreground">3 active. Edit in <code className="rounded bg-secondary px-1">mock-data.ts</code> · testimonials.</p>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">FAQs</h3>
        <p className="mt-1 text-xs text-muted-foreground">6 entries on <code className="rounded bg-secondary px-1">/support</code>.</p>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Campus partners</h3>
        <p className="mt-1 text-xs text-muted-foreground">8 listed. Logos via emoji until brand kit ships.</p>
      </Card>
    </div>
  );
}

function BroadcastTab() {
  const [text, setText] = useState("");
  const send = () => {
    if (text.trim().length < 10) { toast.error("Announcement needs 10+ chars."); return; }
    notifications.push({ icon: "spark", text: `📣 ${text.trim()}` });
    toast.success("Broadcast sent to all users on this device.");
    setText("");
  };
  return (
    <Card className="max-w-xl p-6">
      <h3 className="font-semibold text-foreground">Push announcement</h3>
      <p className="mt-1 text-xs text-muted-foreground">Reaches every user on this browser via the notification bell.</p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={240} className="mt-4" placeholder="Scope Hack '26 registrations open today…" />
      <Button onClick={send} className="mt-3 bg-gradient-brand text-brand-foreground"><Plus className="mr-1.5 h-3.5 w-3.5" /> Broadcast</Button>
    </Card>
  );
}

function ModerationTab() {
  const ideas = ideaSubmissions.all();
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Idea submissions ({ideas.length})</h3>
          <Button variant="outline" size="sm" onClick={() => { try { localStorage.removeItem("scope_idea_submissions"); window.dispatchEvent(new CustomEvent("scope:store-change")); toast.success("Cleared"); } catch { /* noop */ } }}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear all</Button>
        </div>
        {ideas.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No private idea submissions yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ideas.slice(0, 8).map((i) => (
              <li key={i.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{i.anonymous ? "Anonymous" : "Identified"}</Badge><span className="text-xs text-muted-foreground">{new Date(i.at).toLocaleString()}</span></div>
                <div className="mt-2 text-sm font-semibold text-foreground">{i.title}</div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.problem}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="border-destructive/30 bg-destructive/5 p-5">
        <h3 className="font-semibold text-foreground">Danger zone</h3>
        <p className="mt-1 text-xs text-muted-foreground">Wipe all local data on this device. Useful for fresh demos.</p>
        <Button variant="destructive" size="sm" className="mt-3" onClick={() => { meta.resetAll(); toast.success("All local data reset"); }}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reset demo data</Button>
      </Card>
    </div>
  );
}
