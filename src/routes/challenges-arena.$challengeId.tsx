import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Trophy, Clock, Award, Users, AlertTriangle, Crown, Medal, Star, Flag } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useStoreValue, useUser, useXP } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import { xp as xpStore, notifications } from "@/lib/scope-store";
import {
  challengeArena, joinChallenge, submitChallenge, finalizeChallenge,
  evaluateChallengeEligibility, isEligible, canReviewChallenge,
  computeTotalScore, COMMITMENT_MESSAGE,
  type EvaluationScores, type BadgeName,
} from "@/lib/challenge-arena-store";

export const Route = createFileRoute("/challenges-arena/$challengeId")({
  head: ({ params }) => ({
    meta: [
      { title: "Challenge — Scope Connect" },
      { name: "robots", content: "noindex,follow" },
      { property: "og:url", content: `/challenges-arena/${params.challengeId}` },
    ],
  }),
  component: ChallengeDetailPage,
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Challenge not found</h1>
        <Button asChild className="mt-4"><Link to="/challenges-arena">Back to challenges</Link></Button>
      </div>
    </AppShell>
  ),
});

function ChallengeDetailPage() {
  const { challengeId } = Route.useParams();
  const user = useUser();
  const role = useRole();
  const userXp = useXP();

  const challenge = useStoreValue(() => challengeArena.challenges.byId(challengeId));
  const participants = useStoreValue(() => challengeArena.participants.forChallenge(challengeId));
  const submissions = useStoreValue(() => challengeArena.submissions.forChallenge(challengeId));
  const evaluations = useStoreValue(() => challengeArena.evaluations.forChallenge(challengeId));
  const leaderboard = useStoreValue(() => challengeArena.leaderboards.forChallenge(challengeId));
  const rewards = useStoreValue(() => challengeArena.rewards.forChallenge(challengeId));
  const forfeitures = useStoreValue(() => challengeArena.forfeitures.forChallenge(challengeId));

  if (!challenge) throw notFound();

  const myParticipant = user ? participants.find((p) => p.userId === user.id) : undefined;
  const mySubmission = myParticipant ? submissions.find((s) => s.participantId === myParticipant.id) : undefined;
  const expired = Date.now() > challenge.challengeDeadline;
  const daysToDeadline = Math.max(0, Math.ceil((challenge.challengeDeadline - Date.now()) / 86400000));

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-10 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/challenges-arena" className="text-sm text-primary-foreground/70 hover:text-primary-foreground">
            <ArrowLeft className="mr-1 inline h-4 w-4" /> Back
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-cyan/15 text-cyan capitalize">{challenge.challengeType.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize text-primary-foreground border-primary-foreground/30">{challenge.status.replace(/_/g, " ")}</Badge>
                {challenge.difficultyLevel && <Badge variant="outline" className="capitalize text-primary-foreground border-primary-foreground/30">{challenge.difficultyLevel}</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{challenge.challengeTitle}</h1>
              <p className="mt-2 text-primary-foreground/70">{challenge.challengeDescription}</p>
            </div>
            <Card className="border-white/10 bg-white/5 p-4 text-primary-foreground backdrop-blur min-w-[220px]">
              <div className="grid grid-cols-2 gap-3 text-center">
                <Stat label="Joined" value={`${participants.length}`} />
                <Stat label="Submitted" value={`${submissions.length}`} />
                <Stat label="Stake" value={`${challenge.commitmentStakeXp} XP`} />
                <Stat label="Pool" value={`${challenge.rewardPoolXp} XP`} />
              </div>
              <div className="mt-3 text-center text-xs text-primary-foreground/70">
                <Clock className="mr-1 inline h-3 w-3" /> {expired ? "Ended" : `${daysToDeadline} days left`}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="join">Join & Submit</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="text-lg font-semibold">About this challenge</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{challenge.challengeDescription}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <KV k="Evaluation method" v={challenge.evaluationMethod.replace(/_/g, " ")} />
                <KV k="Visibility" v={challenge.challengeVisibility.replace(/_/g, " ")} />
                <KV k="Min XP" v={`${challenge.minimumXpRequired}`} />
                <KV k="Min reliability" v={`${challenge.minimumReliabilityScore}`} />
                <KV k="Duration" v={`${challenge.challengeDurationDays} days`} />
                <KV k="Deadline" v={new Date(challenge.challengeDeadline).toLocaleDateString()} />
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Submission formats</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {challenge.submissionFormats.map((f) => (
                    <Badge key={f} variant="outline" className="capitalize">{f.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
              {challenge.requiredSkills && challenge.requiredSkills.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Required skills</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {challenge.requiredSkills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Commitment</h3>
              <div className="mt-3 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="text-sm">
                  <div className="font-semibold">{COMMITMENT_MESSAGE.title}</div>
                  <p className="mt-0.5 text-muted-foreground">{COMMITMENT_MESSAGE.message}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Stake</span><span>{challenge.commitmentStakeXp} XP</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reward pool</span><span>{challenge.rewardPoolXp} XP</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Certificates</span><span>{challenge.certificateEnabled ? "Yes" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Badges</span><span>{challenge.badgeEnabled ? "Yes" : "No"}</span></div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="join" className="mt-6">
            <JoinSubmitPanel
              challengeId={challengeId}
              expired={expired}
              myParticipant={myParticipant}
              mySubmission={mySubmission}
              userXp={userXp}
            />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardPanel
              role={role}
              challengeId={challengeId}
              leaderboard={leaderboard}
              expired={expired}
              hasEvaluations={evaluations.length > 0}
            />
          </TabsContent>

          <TabsContent value="evaluation" className="mt-6">
            <EvaluationPanel
              challengeId={challengeId}
              role={role}
              submissions={submissions}
              evaluations={evaluations}
            />
          </TabsContent>

          <TabsContent value="rewards" className="mt-6">
            <RewardsPanel rewards={rewards} forfeitures={forfeitures} />
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-primary-foreground/60">{label}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="mt-0.5 text-sm font-medium capitalize">{v}</div>
    </div>
  );
}

/* ============================ Join + Submit ============================ */

function JoinSubmitPanel({
  challengeId, expired, myParticipant, mySubmission, userXp,
}: {
  challengeId: string;
  expired: boolean;
  myParticipant?: ReturnType<typeof challengeArena.participants.byUserAndChallenge>;
  mySubmission?: ReturnType<typeof challengeArena.submissions.forParticipant>;
  userXp: number;
}) {
  const user = useUser();
  const role = useRole();
  const challenge = challengeArena.challenges.byId(challengeId);
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState({ title: "", description: "", links: "" });

  const checks = useMemo(
    () =>
      challenge && user
        ? evaluateChallengeEligibility(challenge, {
            userId: user.id,
            userRole: role,
            userXp,
            userReliability: 100,
            userInstitution: undefined,
            userSkills: [],
          })
        : [],
    [challenge, user, role, userXp],
  );

  if (!user) return <Card className="p-6 text-sm text-muted-foreground">Sign in to join this challenge.</Card>;
  if (!challenge) return null;

  function doJoin() {
    const result = joinChallenge(challengeId, {
      userId: user!.id,
      userRole: role,
      userXp,
      userReliability: 100,
    });
    if (!result.ok) return toast.error(result.reason);
    // Patch the participant name to display name
    const list = challengeArena.participants.all();
    const idx = list.findIndex((p) => p.id === result.participant.id);
    if (idx >= 0) list[idx] = { ...list[idx], userName: user!.name };
    // overwrite via private write isn't exposed; use store side-effect through localStorage directly
    try {
      localStorage.setItem("scope_ch4_participants_v1", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: "scope_ch4_participants_v1" } }));
    } catch { /* noop */ }
    xpStore.add(-challenge!.commitmentStakeXp);
    notifications.push({ icon: "trophy", text: `Joined challenge: ${challenge!.challengeTitle} · ${challenge!.commitmentStakeXp} XP staked` });
    toast.success("Joined. Commitment XP locked.");
  }

  function doSubmit() {
    if (!sub.title.trim() || !sub.description.trim()) return toast.error("Title and description are required.");
    const links = sub.links.split(",").map((s) => s.trim()).filter(Boolean).map((url) => ({ url }));
    const result = submitChallenge({
      challengeId,
      userId: user!.id,
      userName: user!.name,
      submissionTitle: sub.title.trim(),
      submissionDescription: sub.description.trim(),
      links,
    });
    if (!result.ok) return toast.error(result.reason);
    notifications.push({ icon: "trophy", text: `Submission received: ${challenge!.challengeTitle}` });
    toast.success("Submission locked in. Good luck.");
    setOpen(false);
    setSub({ title: "", description: "", links: "" });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-lg font-semibold">Eligibility</h3>
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 inline-block h-4 w-4 rounded-full ${c.passed ? "bg-success" : "bg-destructive"}`} />
              <div>
                <div className="font-medium">{c.label}</div>
                {c.note && <div className="text-xs text-muted-foreground">{c.note}</div>}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          {myParticipant ? (
            <Badge variant="secondary"><Crown className="mr-1 h-3 w-3" /> You've joined</Badge>
          ) : expired ? (
            <Badge variant="destructive">Challenge ended</Badge>
          ) : (
            <Button onClick={doJoin} disabled={!isEligible(checks)} className="bg-gradient-brand text-brand-foreground">
              Join & commit {challenge.commitmentStakeXp} XP
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Submission</h3>
        {mySubmission ? (
          <div className="mt-3 space-y-2 text-sm">
            <Badge variant="secondary"><Trophy className="mr-1 h-3 w-3" /> Submitted</Badge>
            <div className="font-semibold">{mySubmission.submissionTitle}</div>
            <p className="text-muted-foreground">{mySubmission.submissionDescription}</p>
            <p className="text-xs text-muted-foreground">Submitted {new Date(mySubmission.submittedAt).toLocaleString()}</p>
          </div>
        ) : myParticipant ? (
          expired ? (
            <p className="mt-3 text-sm text-destructive">Deadline has passed. Stake forfeited if not submitted.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">One submission per participant. No late submissions.</p>
              <Button className="mt-3" onClick={() => setOpen(true)}>Submit work</Button>
            </>
          )
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Join the challenge first to unlock submission.</p>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit your work</DialogTitle>
            <DialogDescription>One-time submission. Locked at deadline.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Submission title</Label>
              <Input value={sub.title} onChange={(e) => setSub({ ...sub, title: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={sub.description} onChange={(e) => setSub({ ...sub, description: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Links (comma-separated)</Label>
              <Input value={sub.links} onChange={(e) => setSub({ ...sub, links: e.target.value })} placeholder="https://github.com/..., https://figma.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={doSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================ Leaderboard ============================ */

function badgeIcon(b?: BadgeName) {
  if (b === "Gold Performer") return <Crown className="h-4 w-4 text-warning" />;
  if (b === "Silver Performer") return <Medal className="h-4 w-4 text-muted-foreground" />;
  if (b === "Bronze Performer") return <Medal className="h-4 w-4 text-orange-500" />;
  return <Star className="h-4 w-4 text-cyan" />;
}

function LeaderboardPanel({
  role, challengeId, leaderboard, expired, hasEvaluations,
}: {
  role: ReturnType<typeof useRole>;
  challengeId: string;
  leaderboard?: ReturnType<typeof challengeArena.leaderboards.forChallenge>;
  expired: boolean;
  hasEvaluations: boolean;
}) {
  function finalize() {
    const out = finalizeChallenge(challengeId);
    if (!out) return toast.error("Could not finalize.");
    toast.success(`Leaderboard published · ${out.rewards.length} rewards · ${out.forfeitures.length} forfeitures`);
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Leaderboard</h3>
        {canReviewChallenge(role) && (expired || hasEvaluations) && (
          <Button size="sm" onClick={finalize} className="bg-gradient-brand text-brand-foreground">
            <Flag className="mr-2 h-4 w-4" /> Publish leaderboard & distribute rewards
          </Button>
        )}
      </div>
      {!leaderboard ? (
        <p className="mt-3 text-sm text-muted-foreground">Leaderboard not generated yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2">Rank</th>
                <th>Student</th>
                <th>Institution</th>
                <th>Score</th>
                <th>Badge</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((e) => (
                <tr key={e.participantId} className="border-t border-border/40">
                  <td className="py-2 font-semibold">{e.status === "qualified" ? `#${e.rank}` : "—"}</td>
                  <td>{e.userName}</td>
                  <td className="text-muted-foreground">{e.institution ?? "—"}</td>
                  <td>{e.score}</td>
                  <td>{e.badge ? <span className="inline-flex items-center gap-1">{badgeIcon(e.badge)}{e.badge}</span> : "—"}</td>
                  <td><Badge variant={e.status === "forfeited" ? "destructive" : "secondary"} className="capitalize">{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ============================ Evaluation ============================ */

function EvaluationPanel({
  challengeId, role, submissions, evaluations,
}: {
  challengeId: string;
  role: ReturnType<typeof useRole>;
  submissions: ReturnType<typeof challengeArena.submissions.forChallenge>;
  evaluations: ReturnType<typeof challengeArena.evaluations.forChallenge>;
}) {
  const user = useUser();
  if (!canReviewChallenge(role)) {
    return <Card className="p-6 text-sm text-muted-foreground">Only Faculty, Institutional Admins and Scope Admins can evaluate submissions.</Card>;
  }
  if (submissions.length === 0) return <Card className="p-6 text-sm text-muted-foreground">No submissions yet.</Card>;

  return (
    <div className="grid gap-4">
      {submissions.map((s) => (
        <SubmissionReviewCard
          key={s.id}
          challengeId={challengeId}
          submission={s}
          existing={evaluations.filter((e) => e.submissionId === s.id)}
          reviewerName={user?.name ?? "Reviewer"}
          reviewerId={user?.id ?? "anon"}
          reviewerRole={role}
        />
      ))}
    </div>
  );
}

function SubmissionReviewCard({
  challengeId, submission, existing, reviewerName, reviewerId, reviewerRole,
}: {
  challengeId: string;
  submission: ReturnType<typeof challengeArena.submissions.forChallenge>[number];
  existing: ReturnType<typeof challengeArena.evaluations.forChallenge>;
  reviewerName: string;
  reviewerId: string;
  reviewerRole: ReturnType<typeof useRole>;
}) {
  const [scores, setScores] = useState<EvaluationScores>({
    executionQuality: 20, innovation: 12, technicalAccuracy: 12, presentation: 10, deadlineAdherence: 12,
  });
  const [feedback, setFeedback] = useState("");
  const total = computeTotalScore(scores);

  function save() {
    challengeArena.evaluations.create({
      challengeId,
      submissionId: submission.id,
      reviewerUserId: reviewerId,
      reviewerName,
      reviewerRole,
      scores,
      feedback: feedback.trim() || undefined,
    });
    toast.success(`Evaluation saved · ${total}/100`);
    setFeedback("");
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{submission.submissionTitle}</h4>
          <p className="text-xs text-muted-foreground">by {submission.userName} · {new Date(submission.submittedAt).toLocaleString()}</p>
        </div>
        <Badge variant={submission.onTime ? "secondary" : "destructive"}>{submission.onTime ? "On time" : "Late"}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{submission.submissionDescription}</p>
      {submission.links && submission.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {submission.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer" className="text-xs text-brand underline">{l.url}</a>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <ScoreInput label="Execution" max={30} value={scores.executionQuality} onChange={(v) => setScores({ ...scores, executionQuality: v })} />
        <ScoreInput label="Innovation" max={20} value={scores.innovation} onChange={(v) => setScores({ ...scores, innovation: v })} />
        <ScoreInput label="Technical" max={20} value={scores.technicalAccuracy} onChange={(v) => setScores({ ...scores, technicalAccuracy: v })} />
        <ScoreInput label="Presentation" max={15} value={scores.presentation} onChange={(v) => setScores({ ...scores, presentation: v })} />
        <ScoreInput label="Deadline" max={15} value={scores.deadlineAdherence} onChange={(v) => setScores({ ...scores, deadlineAdherence: v })} />
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Total</span><span className="font-semibold">{total}/100</span></div>
        <Progress value={total} className="h-2" />
      </div>
      <div className="mt-3 grid gap-1.5">
        <Label>Feedback (optional)</Label>
        <Textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{existing.length} prior evaluation(s)</div>
        <Button size="sm" onClick={save}>Save evaluation</Button>
      </div>
    </Card>
  );
}

function ScoreInput({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div>
      <Label className="text-xs">{label} <span className="text-muted-foreground">/{max}</span></Label>
      <Input type="number" min={0} max={max} value={value} onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value))))} />
    </div>
  );
}

/* ============================== Rewards ============================== */

function RewardsPanel({
  rewards, forfeitures,
}: {
  rewards: ReturnType<typeof challengeArena.rewards.forChallenge>;
  forfeitures: ReturnType<typeof challengeArena.forfeitures.forChallenge>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-lg font-semibold"><Award className="mr-2 inline h-4 w-4 text-success" /> Distributed rewards</h3>
        {rewards.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No rewards distributed yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rewards.sort((a, b) => a.rank - b.rank).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-border/60 p-3 text-sm">
                <div className="flex items-center gap-2">
                  {badgeIcon(r.badge)}
                  <div>
                    <div className="font-medium">#{r.rank} · {r.userName}</div>
                    <div className="text-xs text-muted-foreground">{r.badge ?? "—"} · ×{r.multiplier}</div>
                  </div>
                </div>
                <Badge className="bg-gradient-brand text-brand-foreground">+{r.xpAwarded} XP</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-5">
        <h3 className="text-lg font-semibold"><AlertTriangle className="mr-2 inline h-4 w-4 text-destructive" /> Forfeitures</h3>
        {forfeitures.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No forfeitures logged.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {forfeitures.map((f) => (
              <li key={f.id} className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{f.userId}</span>
                  <Badge variant="destructive">-{f.xpForfeited} XP</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{f.reason.replace(/_/g, " ")}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {f.negativeTags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
