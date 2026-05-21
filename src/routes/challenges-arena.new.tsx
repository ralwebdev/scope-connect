import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/site/AppShell";
import { AccessDenied } from "@/components/site/AccessDenied";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useRole } from "@/hooks/use-rbac";
import { useUser } from "@/hooks/use-scope";
import { ROLE_LABELS } from "@/lib/rbac";
import {
  challengeArena, canCreateChallenge,
  type ChallengeType, type ChallengeDifficulty, type ChallengeVisibility,
  type EvaluationMethod, type SubmissionFormat,
} from "@/lib/challenge-arena-store";

export const Route = createFileRoute("/challenges-arena/new")({
  head: () => ({
    meta: [
      { title: "Create Challenge — Scope Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: NewChallengePage,
});

const TYPES: ChallengeType[] = [
  "design", "ui_ux", "content_writing", "software_development", "web_development",
  "mobile_development", "marketing", "business_strategy", "research", "video_editing",
  "graphic_design", "animation", "photography", "innovation", "startup", "cross_domain", "custom",
];
const DIFFICULTY: ChallengeDifficulty[] = ["beginner", "intermediate", "advanced", "expert"];
const VISIBILITY: ChallengeVisibility[] = ["public", "institution_only", "invite_only"];
const METHODS: EvaluationMethod[] = ["manual_review", "rubric_based_scoring", "mentor_review", "jury_review", "hybrid"];
const FORMATS: SubmissionFormat[] = [
  "pdf", "ppt", "docx", "zip", "github_repository", "figma_link",
  "behance_link", "portfolio_link", "google_drive_link", "youtube_link", "text_submission",
];

type Draft = {
  challengeTitle: string;
  challengeType: ChallengeType;
  challengeDescription: string;
  difficultyLevel: ChallengeDifficulty;
  challengeDurationDays: number;
  challengeDeadline: string;
  minimumXpRequired: number;
  minimumReliabilityScore: number;
  allowedInstitutions: string;
  requiredSkills: string;
  challengeVisibility: ChallengeVisibility;
  commitmentStakeXp: number;
  rewardPoolXp: number;
  certificateEnabled: boolean;
  badgeEnabled: boolean;
  evaluationMethod: EvaluationMethod;
  submissionFormats: SubmissionFormat[];
};

function NewChallengePage() {
  const role = useRole();
  const user = useUser();
  const navigate = useNavigate();

  if (!canCreateChallenge(role)) {
    return (
      <AppShell>
        <AccessDenied role={role} title="Challenge creation restricted" message="Only Faculty Coordinators, Institutional Admins, Scope Admins or Super Admins can create challenges." />
      </AppShell>
    );
  }

  const [step, setStep] = useState(1);
  const [d, setD] = useState<Draft>({
    challengeTitle: "",
    challengeType: "innovation",
    challengeDescription: "",
    difficultyLevel: "intermediate",
    challengeDurationDays: 7,
    challengeDeadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    minimumXpRequired: 0,
    minimumReliabilityScore: 50,
    allowedInstitutions: "",
    requiredSkills: "",
    challengeVisibility: "public",
    commitmentStakeXp: 50,
    rewardPoolXp: 500,
    certificateEnabled: true,
    badgeEnabled: true,
    evaluationMethod: "rubric_based_scoring",
    submissionFormats: ["pdf", "github_repository"],
  });

  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  function validate(n: number): string | null {
    if (n === 1) {
      if (!d.challengeTitle.trim()) return "Title is required.";
      if (!d.challengeDescription.trim()) return "Description is required.";
      if (d.challengeDurationDays <= 0) return "Duration must be positive.";
      if (!d.challengeDeadline) return "Deadline is required.";
    }
    if (n === 3) {
      if (d.commitmentStakeXp < 0) return "Commitment Stake cannot be negative.";
      if (d.rewardPoolXp < 0) return "Reward pool cannot be negative.";
    }
    if (n === 4 && d.submissionFormats.length === 0) return "Pick at least one submission format.";
    return null;
  }

  function next() {
    const e = validate(step);
    if (e) return toast.error(e);
    setStep((s) => Math.min(4, s + 1));
  }
  function back() { setStep((s) => Math.max(1, s - 1)); }

  function publish() {
    for (let i = 1; i <= 4; i++) {
      const e = validate(i);
      if (e) { setStep(i); return toast.error(e); }
    }
    if (!user) return toast.error("Sign in required.");
    const created = challengeArena.challenges.create({
      challengeTitle: d.challengeTitle.trim(),
      challengeType: d.challengeType,
      challengeDescription: d.challengeDescription.trim(),
      difficultyLevel: d.difficultyLevel,
      challengeDurationDays: d.challengeDurationDays,
      challengeDeadline: new Date(d.challengeDeadline).getTime(),
      minimumXpRequired: d.minimumXpRequired,
      minimumReliabilityScore: d.minimumReliabilityScore,
      allowedInstitutions: d.allowedInstitutions.split(",").map((s) => s.trim()).filter(Boolean),
      requiredSkills: d.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      challengeVisibility: d.challengeVisibility,
      commitmentStakeXp: d.commitmentStakeXp,
      rewardPoolXp: d.rewardPoolXp,
      certificateEnabled: d.certificateEnabled,
      badgeEnabled: d.badgeEnabled,
      evaluationMethod: d.evaluationMethod,
      submissionFormats: d.submissionFormats,
      createdByUserId: user.id,
      createdByName: user.name,
      createdByRole: role,
      status: "open",
    });
    toast.success("Challenge published.");
    navigate({ to: "/challenges-arena/$challengeId", params: { challengeId: created.id } });
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/challenges-arena" className="text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to challenges
        </Link>
        <div className="mt-4">
          <Badge variant="outline">Step {step} of 4</Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Create challenge</h1>
          <p className="mt-1 text-sm text-muted-foreground">Authoring as <strong>{ROLE_LABELS[role]}</strong>.</p>
        </div>
        <Progress value={(step / 4) * 100} className="mt-4 h-2" />

        <Card className="mt-6 p-6">
          {step === 1 && (
            <div className="grid gap-4">
              <h2 className="text-lg font-semibold">Basic information</h2>
              <Field label="Title">
                <Input value={d.challengeTitle} onChange={(e) => u("challengeTitle", e.target.value)} placeholder="e.g. Build a Landing Page in 48 Hours" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type">
                  <Select value={d.challengeType} onValueChange={(v) => u("challengeType", v as ChallengeType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Difficulty">
                  <Select value={d.difficultyLevel} onValueChange={(v) => u("difficultyLevel", v as ChallengeDifficulty)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Description">
                <Textarea rows={4} value={d.challengeDescription} onChange={(e) => u("challengeDescription", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Duration (days)">
                  <Input type="number" min={1} value={d.challengeDurationDays} onChange={(e) => u("challengeDurationDays", Number(e.target.value))} />
                </Field>
                <Field label="Deadline">
                  <Input type="date" value={d.challengeDeadline} onChange={(e) => u("challengeDeadline", e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <h2 className="text-lg font-semibold">Eligibility rules</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Minimum XP required">
                  <Input type="number" min={0} value={d.minimumXpRequired} onChange={(e) => u("minimumXpRequired", Number(e.target.value))} />
                </Field>
                <Field label="Minimum reliability score">
                  <Input type="number" min={0} max={100} value={d.minimumReliabilityScore} onChange={(e) => u("minimumReliabilityScore", Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Visibility">
                <Select value={d.challengeVisibility} onValueChange={(v) => u("challengeVisibility", v as ChallengeVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBILITY.map((v) => <SelectItem key={v} value={v} className="capitalize">{v.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Required skills (comma-separated)">
                <Input value={d.requiredSkills} onChange={(e) => u("requiredSkills", e.target.value)} placeholder="react, figma" />
              </Field>
              <Field label="Allowed institutions (comma-separated, blank = all)">
                <Input value={d.allowedInstitutions} onChange={(e) => u("allowedInstitutions", e.target.value)} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <h2 className="text-lg font-semibold">XP & rewards</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Commitment Stake (XP)" hint="Locked at join, forfeited on non-submission.">
                  <Input type="number" min={0} value={d.commitmentStakeXp} onChange={(e) => u("commitmentStakeXp", Number(e.target.value))} />
                </Field>
                <Field label="Reward pool (XP)">
                  <Input type="number" min={0} value={d.rewardPoolXp} onChange={(e) => u("rewardPoolXp", Number(e.target.value))} />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <Label>Certificates enabled</Label>
                  <p className="text-xs text-muted-foreground">Issue participation, top performer & winner certificates.</p>
                </div>
                <Switch checked={d.certificateEnabled} onCheckedChange={(v) => u("certificateEnabled", v)} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <Label>Badges enabled</Label>
                  <p className="text-xs text-muted-foreground">Award rank-based badges (Gold/Silver/Bronze/Finisher).</p>
                </div>
                <Switch checked={d.badgeEnabled} onCheckedChange={(v) => u("badgeEnabled", v)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4">
              <h2 className="text-lg font-semibold">Evaluation</h2>
              <Field label="Evaluation method">
                <Select value={d.evaluationMethod} onValueChange={(v) => u("evaluationMethod", v as EvaluationMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Submission formats" hint="Click to toggle.">
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((f) => {
                    const on = d.submissionFormats.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => u("submissionFormats", on ? d.submissionFormats.filter((x) => x !== f) : [...d.submissionFormats, f])}
                        className={`rounded-full border px-3 py-1 text-xs capitalize transition ${on ? "border-brand bg-brand/10 text-brand" : "border-border/60 text-muted-foreground hover:bg-accent"}`}
                      >
                        {f.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
            <Button variant="ghost" disabled={step === 1} onClick={back}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button onClick={next}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button onClick={publish} className="bg-gradient-brand text-brand-foreground">
                <Check className="mr-2 h-4 w-4" /> Publish challenge
              </Button>
            )}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
