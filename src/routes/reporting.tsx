import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Flame, AlertTriangle, ShieldAlert, ShieldCheck, RefreshCcw, FileText, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/site/AppShell";
import { AuthGate } from "@/components/site/AuthGate";
import { useStoreValue, useUser } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import { ROLE_LABELS } from "@/lib/rbac";
import {
  reporting, rolesAllowedToReview, type ReportAssignment, PENALTY_LADDER,
} from "@/lib/reporting-store";
import { DailyReportDialog } from "@/components/reporting/DailyReportDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/reporting")({
  head: () => ({
    meta: [
      { title: "Daily Reporting — Scope Connect" },
      { name: "description", content: "Mandatory daily reporting, streak tracking and accountability for projects and internships." },
      { property: "og:title", content: "Daily Reporting — Scope Connect" },
      { property: "og:description", content: "Trust-first accountability portal for builders, mentors and admins." },
    ],
  }),
  component: () => <AuthGate><Page /></AuthGate>,
});

function Page() {
  const role = useRole();
  const user = useUser();
  // Re-evaluate penalties on mount so dashboards show fresh ladder state.
  useEffect(() => { reporting.evaluate(); }, []);
  const isReviewer = rolesAllowedToReview(role);

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">
              <CalendarCheck className="mr-1 h-3 w-3" /> Mandatory · daily
            </Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Daily Reporting Portal</h1>
            <p className="mt-2 max-w-xl text-primary-foreground/70">
              No gap days. Submitting daily preserves trust score, streak, badges and project status.
            </p>
          </div>
          <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
            View as {ROLE_LABELS[role]}
          </Badge>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="me">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="me">My reports</TabsTrigger>
            {isReviewer && <TabsTrigger value="team">Team / Reviewer</TabsTrigger>}
            {isReviewer && <TabsTrigger value="penalties">Penalty engine</TabsTrigger>}
            {isReviewer && <TabsTrigger value="recovery">Recovery queue</TabsTrigger>}
          </TabsList>

          <TabsContent value="me" className="mt-6">
            <MyReports userId={user?.id} />
          </TabsContent>
          {isReviewer && <TabsContent value="team" className="mt-6"><ReviewerView role={role} /></TabsContent>}
          {isReviewer && <TabsContent value="penalties" className="mt-6"><PenaltyView /></TabsContent>}
          {isReviewer && <TabsContent value="recovery" className="mt-6"><RecoveryView /></TabsContent>}
        </Tabs>
      </section>
    </AppShell>
  );
}

/* ----------------------------- My Reports ----------------------------- */

function MyReports({ userId }: { userId?: string }) {
  const all = useStoreValue(() => reporting.assignments());
  // Demo fallback: if user has no assignments, show all seed assignments so the page is usable.
  const mine = useMemo(() => {
    const own = userId ? all.filter((a) => a.userId === userId) : [];
    return own.length ? own : all.slice(0, 3);
  }, [all, userId]);

  if (mine.length === 0) {
    return <Empty icon={FileText} text="No active project assignments." />;
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {mine.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: ReportAssignment }) {
  const [open, setOpen] = useState(false);
  const today = useStoreValue(() => reporting.todayReport(assignment.id));
  const streak = useStoreValue(() => reporting.streakFor(assignment.id));
  const compliance = useStoreValue(() => reporting.missedDaysFor(assignment.id));
  const penalties = useStoreValue(() => reporting.penaltiesFor(assignment.id).filter((p) => !p.resolved));
  const total = compliance.expectedKeys.length || 1;
  const submitted = total - compliance.missedDays - (today ? 0 : 1) + (today ? 1 : 0);
  const pct = Math.max(0, Math.min(100, Math.round((submitted / total) * 100)));

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{assignment.projectType}</Badge>
            {assignment.teamMode && <Badge variant="secondary">team</Badge>}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{assignment.projectTitle}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Started {new Date(assignment.startedAt).toLocaleDateString()} · mentor {assignment.mentor ?? "—"}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-gradient-brand text-brand-foreground">
          <CalendarCheck className="mr-2 h-4 w-4" /> {today ? "Edit today" : "Submit today"}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat icon={Flame} label="Streak" value={`${streak}d`} tone="brand" />
        <Stat icon={AlertTriangle} label="Missed" value={String(compliance.missedDays)} tone={compliance.missedDays >= 3 ? "danger" : compliance.missedDays >= 1 ? "warn" : "ok"} />
        <Stat icon={ShieldCheck} label="Compliance" value={`${pct}%`} tone={pct >= 80 ? "ok" : pct >= 50 ? "warn" : "danger"} />
      </div>

      <Progress value={pct} className="mt-3 h-2" />

      {penalties.length > 0 && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-semibold text-destructive">
            <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
            Active penalty: level {Math.max(...penalties.map((p) => p.level))}
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
            {penalties.flatMap((p) => p.actions).map((a, i) => <li key={i}>{a.replace(/_/g, " ")}</li>)}
          </ul>
          <RecoveryRequestForm assignment={assignment} />
        </div>
      )}

      <DailyReportDialog assignment={assignment} open={open} onOpenChange={setOpen} />
    </Card>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "ok" | "warn" | "danger" | "brand" }) {
  const cls =
    tone === "ok" ? "text-success" :
    tone === "warn" ? "text-warning" :
    tone === "danger" ? "text-destructive" : "text-brand";
  return (
    <div className="rounded-md border border-border/60 p-3">
      <Icon className={`mx-auto h-4 w-4 ${cls}`} />
      <div className={`mt-1 text-lg font-bold ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function RecoveryRequestForm({ assignment }: { assignment: ReportAssignment }) {
  const [reason, setReason] = useState("");
  const compliance = useStoreValue(() => reporting.missedDaysFor(assignment.id));
  const open = useStoreValue(() => reporting.recoveriesFor(assignment.id).find((r) => r.status === "pending"));
  if (open) return <p className="mt-2 text-xs text-muted-foreground">Recovery request pending mentor review.</p>;
  return (
    <div className="mt-3 grid gap-2">
      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for missed days…" rows={2} />
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (!reason.trim()) return toast.error("Please share a reason.");
          reporting.requestRecovery({ assignmentId: assignment.id, reason: reason.trim(), backlogDays: compliance.missedKeys });
          toast.success("Recovery request sent to mentor.");
          setReason("");
        }}
      >
        <RefreshCcw className="mr-2 h-4 w-4" /> Request recovery
      </Button>
    </div>
  );
}

/* ----------------------------- Reviewer ----------------------------- */

function ReviewerView({ role: _role }: { role: string }) {
  const all = useStoreValue(() => reporting.assignments());
  return (
    <div className="grid gap-4">
      {all.map((a) => {
        const compliance = reporting.missedDaysFor(a.id);
        const today = reporting.todayReport(a.id);
        const flagged = compliance.missedDays >= 3;
        return (
          <Card key={a.id} className={`p-4 ${flagged ? "border-destructive/40" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{a.projectType}</Badge>
                  {a.teamMode && <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                  {flagged && <Badge variant="destructive">flagged</Badge>}
                </div>
                <h4 className="mt-1 text-sm font-semibold text-foreground">{a.projectTitle}</h4>
                <p className="text-xs text-muted-foreground">{a.userName} · {a.institution ?? "—"} · mentor {a.mentor ?? "—"}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span><b className="text-foreground">{compliance.missedDays}</b> missed</span>
                <span>·</span>
                <span>today: {today ? <span className="text-success">submitted</span> : <span className="text-warning">pending</span>}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ----------------------------- Penalty ----------------------------- */

function PenaltyView() {
  const events = useStoreValue(() => reporting.penalties());
  const assignments = reporting.assignments();
  const find = (id: string) => assignments.find((a) => a.id === id);
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold">Escalation ladder</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PENALTY_LADDER.map((rung) => (
            <div key={rung.level} className="rounded-md border border-border/60 p-3">
              <div className="text-xs font-bold text-foreground">Day {rung.level}+</div>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                {rung.actions.map((a) => <li key={a}>{a.replace(/_/g, " ")}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {events.length === 0 ? (
        <Empty icon={ShieldCheck} text="No penalties triggered. Compliance is healthy." />
      ) : (
        <div className="grid gap-3">
          {events.map((p) => {
            const a = find(p.assignmentId);
            return (
              <Card key={p.id} className={`p-4 ${p.resolved ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge variant={p.resolved ? "secondary" : "destructive"}>Level {p.level}</Badge>
                    <h4 className="mt-1 text-sm font-semibold text-foreground">{a?.projectTitle ?? p.assignmentId}</h4>
                    <p className="text-xs text-muted-foreground">{a?.userName} · {p.missedDays} missed days · {new Date(p.at).toLocaleString()}</p>
                  </div>
                  {p.resolved && <Badge className="bg-success/15 text-success">resolved</Badge>}
                </div>
                <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                  {p.actions.map((a) => <li key={a}>{a.replace(/_/g, " ")}</li>)}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Recovery ----------------------------- */

function RecoveryView() {
  const recoveries = useStoreValue(() => reporting.recoveries());
  const user = useUser();
  const role = useRole();
  const assignments = reporting.assignments();
  const find = (id: string) => assignments.find((a) => a.id === id);

  if (recoveries.length === 0) {
    return <Empty icon={RefreshCcw} text="No recovery requests yet." />;
  }
  return (
    <div className="grid gap-3">
      {recoveries.map((r) => {
        const a = find(r.assignmentId);
        return (
          <Card key={r.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge>{r.status}</Badge>
                <h4 className="mt-1 text-sm font-semibold text-foreground">{a?.projectTitle ?? r.assignmentId}</h4>
                <p className="text-xs text-muted-foreground">{a?.userName} · {r.backlogDays.length} backlog days</p>
                <p className="mt-2 text-sm text-foreground">"{r.reason}"</p>
                {r.reviewerNote && <p className="mt-1 text-xs text-muted-foreground">Reviewer: {r.reviewerNote}</p>}
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-success text-primary-foreground" onClick={() => {
                    reporting.reviewRecovery(r.id, "approved", user?.name ?? ROLE_LABELS[role]);
                    toast.success("Approved. Penalties cleared, backlog accepted.");
                  }}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => {
                    reporting.reviewRecovery(r.id, "rejected", user?.name ?? ROLE_LABELS[role]);
                    toast("Rejected. Penalty remains active.");
                  }}>Reject</Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 p-10 text-muted-foreground">
      <Icon className="h-8 w-8" />
      <p>{text}</p>
    </Card>
  );
}
