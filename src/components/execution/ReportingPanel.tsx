// Scope Connect — Execution Reporting Panel (Part 3 UI).
// Additive: rendered inside the existing execution.$projectId Tabs system.
// Reuses shadcn primitives + design tokens; no new global styles.

import { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ClipboardList, Star, ShieldAlert, Trophy,
  Activity, UserCheck, Crown, Lock, Hourglass,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useStoreValue, useUser } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import { projectsExec, type ExecutionProject, type RoomParticipant } from "@/lib/projects-execution-store";
import {
  execReporting, CONTRIBUTION_BANDS, REPORTING_LADDER, canMentorReview,
  type PeerReviewCriterion, type MentorReviewCriterion,
} from "@/lib/execution-reporting-store";

const PEER_CRITERIA: PeerReviewCriterion[] = [
  "collaboration", "responsiveness", "task_execution", "consistency", "communication",
];
const MENTOR_CRITERIA: MentorReviewCriterion[] = [
  "execution_quality", "task_completion", "reliability", "initiative", "communication",
];

export function ReportingPanel({
  project, participants, myParticipant, meIsCoordinator,
}: {
  project: ExecutionProject;
  participants: RoomParticipant[];
  myParticipant?: RoomParticipant;
  meIsCoordinator: boolean;
}) {
  const user = useUser();
  const role = useRole();

  // Evaluate escalation ladder on every render of this tab.
  useStoreValue(() => execReporting.warnings.evaluateAll().length);

  const myStatus = useStoreValue(() =>
    myParticipant ? execReporting.compliance.statusFor(myParticipant.id) : null
  );
  const cooldown = useStoreValue(() => user ? execReporting.cooldowns.activeFor(user.id) : undefined);
  const distribution = useStoreValue(() => execReporting.reward.distribute(project.id));

  return (
    <div className="space-y-4">
      {cooldown && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Cooldown active</p>
              <p className="text-xs text-muted-foreground">
                Reason: {cooldown.reason.replace(/_/g, " ")} · Ends{" "}
                {new Date(cooldown.endsAt).toLocaleString()}. You cannot join new projects
                or apply to premium opportunities until the cooldown ends.
              </p>
            </div>
          </div>
        </Card>
      )}

      {myParticipant ? (
        <>
          <EscalationBanner status={myStatus} />
          <DailyReportCard project={project} participant={myParticipant} />
          <ContributionScoreCard participant={myParticipant} />
          <PeerReviewCard project={project} participants={participants} myUserId={user?.id} />
        </>
      ) : (
        <Card className="p-5 text-sm text-muted-foreground">
          Join this project to submit daily reports, peer reviews and earn a contribution score.
        </Card>
      )}

      {(meIsCoordinator || canMentorReview(role, false)) && (
        <MentorReviewCard project={project} participants={participants} />
      )}

      <RewardPreviewCard distribution={distribution} pool={project.rewardPoolXp} />
    </div>
  );
}

/* ---------------------- Escalation banner ----------------------------- */

function EscalationBanner({
  status,
}: { status: ReturnType<typeof execReporting.compliance.statusFor> | null }) {
  if (!status) return null;
  if (status.level === 0) {
    return (
      <Card className="border-success/30 bg-success/5 p-3 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>On track — no missed daily reports.</span>
        </div>
      </Card>
    );
  }
  const tone =
    status.level >= 5 ? "destructive" :
    status.level >= 3 ? "warning" : "muted";
  return (
    <Card className={`p-3 text-sm border-${tone}/40 bg-${tone}/5`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={`mt-0.5 h-4 w-4 text-${tone}`} />
        <div className="flex-1">
          <p className="font-semibold capitalize">{status.status.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground">
            {status.missedDays} missed report{status.missedDays === 1 ? "" : "s"} · Escalation level {status.level} of 5.
            Reaching level 5 triggers full Commitment Forfeiture.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ---------------------- Daily Report Card ----------------------------- */

function DailyReportCard({
  project, participant,
}: { project: ExecutionProject; participant: RoomParticipant }) {
  const user = useUser();
  const today = useStoreValue(() => execReporting.reports.todayFor(participant.id));
  const recent = useStoreValue(() => execReporting.reports.byParticipant(participant.id).slice(0, 5));
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Daily Progress Report
          </h3>
          <p className="text-xs text-muted-foreground">
            Mandatory every day from joining to project completion. Deadline: 23:59 local time.
          </p>
        </div>
        <Badge variant={today ? "secondary" : "outline"}>
          {today ? "Submitted today" : "Pending today"}
        </Badge>
      </div>

      <Button
        className="mt-4 w-full"
        variant={today ? "outline" : "default"}
        onClick={() => setOpen(true)}
        disabled={!user}
      >
        {today ? "Edit today's report" : "Submit today's report"}
      </Button>

      {recent.length > 0 && (
        <>
          <Separator className="my-4" />
          <p className="text-xs font-medium text-muted-foreground">Recent submissions</p>
          <div className="mt-2 space-y-2">
            {recent.map((r) => (
              <div key={r.id} className="rounded-md border border-border/60 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.day}</span>
                  <span className="text-muted-foreground">{new Date(r.submittedAt).toLocaleTimeString()}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{r.data.todayWork}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <DailyReportDialog
        open={open}
        onOpenChange={setOpen}
        project={project}
        participant={participant}
        existing={today}
      />
    </Card>
  );
}

function DailyReportDialog({
  open, onOpenChange, project, participant, existing,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  project: ExecutionProject; participant: RoomParticipant;
  existing?: ReturnType<typeof execReporting.reports.todayFor>;
}) {
  const [todayWork, setTodayWork] = useState(existing?.data.todayWork ?? "");
  const [deliverablesSubmitted, setDeliverables] = useState(existing?.data.deliverablesSubmitted ?? "");
  const [blockers, setBlockers] = useState(existing?.data.blockers ?? "");
  const [hoursSpent, setHours] = useState(existing?.data.hoursSpent ?? 0);
  const [tomorrowPlan, setTomorrow] = useState(existing?.data.tomorrowPlan ?? "");
  const [proofLinks, setProofLinks] = useState((existing?.data.proofLinks ?? []).join("\n"));

  function handleSubmit() {
    const out = execReporting.reports.submit({
      projectId: project.id,
      participantId: participant.id,
      userId: participant.userId,
      userName: participant.userName,
      data: {
        todayWork,
        deliverablesSubmitted,
        blockers,
        hoursSpent: Number(hoursSpent) || 0,
        tomorrowPlan,
        proofLinks: proofLinks.split("\n").map((s) => s.trim()).filter(Boolean),
      },
    });
    if (!out.ok) return toast.error(out.reason);
    toast.success("Daily report submitted.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Daily Progress Report</DialogTitle>
          <DialogDescription>
            Fill all required fields. Missed days trigger an escalation ladder up to full forfeiture.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid gap-1.5">
            <Label>Today's work *</Label>
            <Textarea rows={3} value={todayWork} onChange={(e) => setTodayWork(e.target.value)} placeholder="At least 20 characters" />
          </div>
          <div className="grid gap-1.5">
            <Label>Deliverables submitted *</Label>
            <Textarea rows={2} value={deliverablesSubmitted} onChange={(e) => setDeliverables(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Blockers / dependencies *</Label>
            <Textarea rows={2} value={blockers} onChange={(e) => setBlockers(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Hours spent (0–24) *</Label>
            <Input type="number" min={0} max={24} value={hoursSpent}
              onChange={(e) => setHours(Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Tomorrow's plan *</Label>
            <Textarea rows={2} value={tomorrowPlan} onChange={(e) => setTomorrow(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Proof links (one per line)</Label>
            <Textarea rows={2} value={proofLinks} onChange={(e) => setProofLinks(e.target.value)}
              placeholder="GitHub, Figma, Drive, Behance, Portfolio…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------- Contribution Score Card ----------------------- */

function ContributionScoreCard({ participant }: { participant: RoomParticipant }) {
  const score = useStoreValue(() => {
    return execReporting.scores.recompute(participant.id);
  });
  if (!score) return null;
  const meta = CONTRIBUTION_BANDS[score.band];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> Contribution score
          </h3>
          <p className="text-xs text-muted-foreground">Rolling daily — weighted across 5 components.</p>
        </div>
        <Badge>{meta.badge}</Badge>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="text-3xl font-bold">{score.score}</div>
        <div className="flex-1">
          <Progress value={score.score} />
          <p className="mt-1 text-[11px] text-muted-foreground">Reward multiplier: ×{meta.multiplier}</p>
        </div>
      </div>
      <Separator className="my-4" />
      <ul className="grid gap-2 text-xs sm:grid-cols-2">
        <Component label="Deliverables (40%)" value={score.components.deliverables} />
        <Component label="Reporting consistency (20%)" value={score.components.reportingConsistency} />
        <Component label="Peer review (15%)" value={score.components.peer} />
        <Component label="Mentor review (15%)" value={score.components.mentor} />
        <Component label="Engagement (10%)" value={score.components.engagement} />
      </ul>
    </Card>
  );
}

function Component({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-md border border-border/60 p-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <Progress value={value} className="mt-1 h-1" />
    </li>
  );
}

/* ---------------------- Peer Review Card ------------------------------ */

function PeerReviewCard({
  project, participants, myUserId,
}: { project: ExecutionProject; participants: RoomParticipant[]; myUserId?: string }) {
  const reviewable = useMemo(
    () => participants.filter((p) => p.userId !== myUserId && p.status === "active"),
    [participants, myUserId]
  );
  if (!myUserId || reviewable.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Star className="h-4 w-4" /> Peer reviews
      </h3>
      <p className="text-xs text-muted-foreground">
        Review fellow participants on collaboration, responsiveness and execution. Self-review and duplicate reviews are blocked.
      </p>
      <div className="mt-3 space-y-2">
        {reviewable.map((p) => (
          <PeerReviewRow key={p.id} project={project} reviewee={p} />
        ))}
      </div>
    </Card>
  );
}

function PeerReviewRow({ project, reviewee }: { project: ExecutionProject; reviewee: RoomParticipant }) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const existing = useStoreValue(() =>
    !user ? null :
    execReporting.peer.byProject(project.id).find(
      (r) => r.reviewerUserId === user.id && r.revieweeUserId === reviewee.userId
    ) ?? null
  );

  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">{reviewee.userName}</p>
        <p className="text-xs text-muted-foreground">{reviewee.assignedRoleName ?? "No role"}</p>
      </div>
      {existing ? (
        <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Reviewed</Badge>
      ) : (
        <>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!user}>Review</Button>
          <ReviewDialog
            kind="peer"
            open={open}
            onOpenChange={setOpen}
            title={`Peer review — ${reviewee.userName}`}
            criteria={PEER_CRITERIA}
            onSubmit={(scores, note) => {
              if (!user) return;
              const out = execReporting.peer.submit({
                projectId: project.id,
                reviewerUserId: user.id, reviewerName: user.name,
                revieweeUserId: reviewee.userId, revieweeName: reviewee.userName,
                scores: scores as Record<PeerReviewCriterion, number>,
                note,
              });
              if (!out.ok) return toast.error(out.reason);
              toast.success("Peer review submitted.");
              setOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ---------------------- Mentor Review Card ---------------------------- */

function MentorReviewCard({
  project, participants,
}: { project: ExecutionProject; participants: RoomParticipant[] }) {
  const reviewable = participants.filter((p) => p.status === "active");
  if (reviewable.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <UserCheck className="h-4 w-4" /> Mentor / coordinator reviews
      </h3>
      <p className="text-xs text-muted-foreground">Available to Temporary Coordinators, Faculty, Institution Admins and Scope Admins.</p>
      <div className="mt-3 space-y-2">
        {reviewable.map((p) => (
          <MentorReviewRow key={p.id} project={project} reviewee={p} />
        ))}
      </div>
    </Card>
  );
}

function MentorReviewRow({ project, reviewee }: { project: ExecutionProject; reviewee: RoomParticipant }) {
  const user = useUser();
  const role = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">
          {reviewee.userName}
          {reviewee.isTemporaryCoordinator && (
            <Badge variant="secondary" className="ml-2"><Crown className="mr-1 h-3 w-3" /> Coordinator</Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{reviewee.assignedRoleName ?? "No role"}</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!user}>Review</Button>
      <ReviewDialog
        kind="mentor"
        open={open}
        onOpenChange={setOpen}
        title={`Mentor review — ${reviewee.userName}`}
        criteria={MENTOR_CRITERIA}
        onSubmit={(scores, note) => {
          if (!user) return;
          const out = execReporting.mentor.submit({
            projectId: project.id,
            reviewerUserId: user.id, reviewerName: user.name, reviewerRole: role,
            revieweeUserId: reviewee.userId, revieweeName: reviewee.userName,
            scores: scores as Record<MentorReviewCriterion, number>,
            note,
          });
          if (!out.ok) return toast.error(out.reason);
          toast.success("Mentor review submitted.");
          setOpen(false);
        }}
      />
    </div>
  );
}

/* ---------------------- Shared review dialog -------------------------- */

function ReviewDialog<T extends string>({
  kind, open, onOpenChange, title, criteria, onSubmit,
}: {
  kind: "peer" | "mentor";
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string;
  criteria: readonly T[];
  onSubmit: (scores: Record<string, number>, note?: string) => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(criteria.map((c) => [c, 70]))
  );
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Score each criterion from 0 to 100. {kind === "peer" ? "Self & duplicate reviews are blocked." : ""}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {criteria.map((c) => (
            <div key={c} className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="capitalize">{c.replace(/_/g, " ")}</Label>
                <span className="text-xs text-muted-foreground">{scores[c]}</span>
              </div>
              <Input type="range" min={0} max={100} step={5} value={scores[c]}
                onChange={(e) => setScores((s) => ({ ...s, [c]: Number(e.target.value) }))} />
            </div>
          ))}
          <div className="grid gap-1.5">
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(scores, note || undefined)}>Submit review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------- Reward preview -------------------------------- */

function RewardPreviewCard({
  distribution, pool,
}: {
  distribution: ReturnType<typeof execReporting.reward.distribute>;
  pool: number;
}) {
  if (distribution.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Reward distribution preview
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          <Hourglass className="mr-1 inline h-3 w-3" /> Distribution preview will appear once participants accumulate scores.
        </p>
      </Card>
    );
  }
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Reward distribution preview
        </h3>
        <Badge variant="outline">Pool: {pool} XP</Badge>
      </div>
      <p className="text-xs text-muted-foreground">Weighted by contribution score × band multiplier. Inactive contributors receive 0.</p>
      <div className="mt-3 space-y-2">
        {distribution.map((d) => (
          <div key={d.participantId} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
            <div>
              <p className="font-medium">{d.userName}</p>
              <p className="text-[11px] text-muted-foreground capitalize">
                {CONTRIBUTION_BANDS[d.band].badge} · score {d.score}
              </p>
            </div>
            <Badge>{d.payout} XP</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------------- Escalation reference -------------------------- */

export function ReportingLadderInfo() {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" /> Inactivity escalation ladder
      </h3>
      <ol className="mt-3 space-y-2 text-xs">
        {REPORTING_LADDER.map((r) => (
          <li key={r.day} className="rounded-md border border-border/60 p-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Day {r.day}</span>
              <Badge variant={r.day >= 5 ? "destructive" : r.day >= 3 ? "outline" : "secondary"} className="capitalize">
                {r.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{r.actions.map((a) => a.replace(/_/g, " ")).join(" · ")}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
