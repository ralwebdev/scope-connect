import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
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
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRole } from "@/hooks/use-rbac";
import { useUser } from "@/hooks/use-scope";
import { ROLE_LABELS } from "@/lib/rbac";
import {
  projectsExec, canCreateProject,
  type ProjectType, type ProjectDifficulty, type ProjectVisibility,
  type RewardDistributionMethod, type ProjectRoleSpec,
} from "@/lib/projects-execution-store";

export const Route = createFileRoute("/execution/new")({
  head: () => ({
    meta: [
      { title: "Create Execution Project — Scope Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: NewExecutionProjectPage,
});

const PROJECT_TYPES: ProjectType[] = [
  "design", "development", "content", "marketing", "business", "research",
  "media", "magazine", "startup", "innovation", "cross_domain", "custom",
];
const DIFFICULTY: ProjectDifficulty[] = ["beginner", "intermediate", "advanced", "expert"];
const VISIBILITY: ProjectVisibility[] = ["public", "institution_only", "invite_only"];
const REWARD_METHODS: RewardDistributionMethod[] = ["weighted_contribution", "equal_distribution"];

type Draft = {
  projectTitle: string;
  projectType: ProjectType;
  projectDescription: string;
  expectedOutcomes: string;
  difficultyLevel: ProjectDifficulty;
  durationDays: number;
  deadline: string; // yyyy-mm-dd
  participantsNeeded: number;
  minimumXpRequired: number;
  xpCommitmentStake: number;
  visibility: ProjectVisibility;
  requiredSkills: string;
  allowedInstitutions: string;
  roles: ProjectRoleSpec[];
  rewardPoolXp: number;
  bonusRewardEnabled: boolean;
  rewardDistributionMethod: RewardDistributionMethod;
};

function emptyRole(): ProjectRoleSpec {
  return {
    id: `role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    roleName: "", roleCount: 1, roleDescription: "",
    deliverables: "", successCriteria: "",
  };
}

function NewExecutionProjectPage() {
  const role = useRole();
  const user = useUser();
  const navigate = useNavigate();

  if (!canCreateProject(role)) {
    return (
      <AppShell>
        <AccessDenied requiredRoleLabel="Faculty Coordinator, Institutional Admin, Scope Admin or Super Admin" />
      </AppShell>
    );
  }

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>({
    projectTitle: "",
    projectType: "innovation",
    projectDescription: "",
    expectedOutcomes: "",
    difficultyLevel: "intermediate",
    durationDays: 14,
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    participantsNeeded: 4,
    minimumXpRequired: 0,
    xpCommitmentStake: 50,
    visibility: "institution_only",
    requiredSkills: "",
    allowedInstitutions: "",
    roles: [emptyRole()],
    rewardPoolXp: 500,
    bonusRewardEnabled: true,
    rewardDistributionMethod: "weighted_contribution",
  });

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!draft.projectTitle.trim()) return "Project title is required.";
      if (!draft.projectDescription.trim()) return "Description is required.";
      if (!draft.expectedOutcomes.trim()) return "Expected outcomes are required.";
      if (draft.durationDays <= 0) return "Duration must be positive.";
      if (!draft.deadline) return "Deadline is required.";
    }
    if (n === 2) {
      if (draft.participantsNeeded < 1) return "At least 1 participant needed.";
      if (draft.xpCommitmentStake < 0) return "Commitment Stake cannot be negative.";
    }
    if (n === 3) {
      if (!draft.roles.length) return "Add at least one project role.";
      for (const r of draft.roles) {
        if (!r.roleName.trim() || !r.roleDescription.trim() || !r.deliverables.trim() || !r.successCriteria.trim()) {
          return "Every role needs name, description, deliverables and success criteria.";
        }
      }
    }
    if (n === 4) {
      if (draft.rewardPoolXp < 0) return "Reward pool cannot be negative.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(4, s + 1));
  }
  function back() { setStep((s) => Math.max(1, s - 1)); }

  function publish() {
    for (let i = 1; i <= 4; i++) {
      const err = validateStep(i);
      if (err) { setStep(i); return toast.error(err); }
    }
    if (!user) return toast.error("Sign in required.");
    const created = projectsExec.projects.create({
      projectTitle: draft.projectTitle.trim(),
      projectType: draft.projectType,
      projectDescription: draft.projectDescription.trim(),
      expectedOutcomes: draft.expectedOutcomes.trim(),
      difficultyLevel: draft.difficultyLevel,
      durationDays: draft.durationDays,
      deadline: new Date(draft.deadline).getTime(),
      participantsNeeded: draft.participantsNeeded,
      minimumXpRequired: draft.minimumXpRequired,
      xpCommitmentStake: draft.xpCommitmentStake,
      visibility: draft.visibility,
      requiredSkills: draft.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      allowedInstitutions: draft.allowedInstitutions.split(",").map((s) => s.trim()).filter(Boolean),
      roles: draft.roles,
      rewardPoolXp: draft.rewardPoolXp,
      bonusRewardEnabled: draft.bonusRewardEnabled,
      rewardDistributionMethod: draft.rewardDistributionMethod,
      createdByUserId: user.id,
      createdByName: user.name,
      createdByRole: role,
      status: "open_for_participation",
    });
    toast.success("Execution project published.");
    navigate({ to: "/execution/$projectId", params: { projectId: created.id } });
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/execution" className="text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to projects
        </Link>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <Badge variant="outline">Step {step} of 4</Badge>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Create execution project</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You're authoring as <strong>{ROLE_LABELS[role]}</strong>.
            </p>
          </div>
        </div>
        <Progress value={(step / 4) * 100} className="mt-4 h-2" />

        <Card className="mt-6 p-6">
          {step === 1 && <Step1 d={draft} u={update} />}
          {step === 2 && <Step2 d={draft} u={update} />}
          {step === 3 && <Step3 d={draft} u={update} />}
          {step === 4 && <Step4 d={draft} u={update} />}

          <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
            <Button variant="ghost" disabled={step === 1} onClick={back}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button onClick={next}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button onClick={publish} className="bg-gradient-brand text-brand-foreground">
                <Check className="mr-2 h-4 w-4" /> Publish project
              </Button>
            )}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

/* ------------------------------- Steps ------------------------------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Step1({ d, u }: { d: Draft; u: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold">Basic information</h2>
      <Field label="Project title">
        <Input value={d.projectTitle} onChange={(e) => u("projectTitle", e.target.value)} placeholder="e.g. Campus Sustainability Microsite" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project type">
          <Select value={d.projectType} onValueChange={(v) => u("projectType", v as ProjectType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Difficulty">
          <Select value={d.difficultyLevel} onValueChange={(v) => u("difficultyLevel", v as ProjectDifficulty)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIFFICULTY.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Project description">
        <Textarea rows={4} value={d.projectDescription} onChange={(e) => u("projectDescription", e.target.value)} />
      </Field>
      <Field label="Expected outcomes">
        <Textarea rows={3} value={d.expectedOutcomes} onChange={(e) => u("expectedOutcomes", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Duration (days)">
          <Input type="number" min={1} value={d.durationDays} onChange={(e) => u("durationDays", Number(e.target.value))} />
        </Field>
        <Field label="Deadline">
          <Input type="date" value={d.deadline} onChange={(e) => u("deadline", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Step2({ d, u }: { d: Draft; u: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold">Participation rules</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Participants needed">
          <Input type="number" min={1} value={d.participantsNeeded} onChange={(e) => u("participantsNeeded", Number(e.target.value))} />
        </Field>
        <Field label="Minimum XP required">
          <Input type="number" min={0} value={d.minimumXpRequired} onChange={(e) => u("minimumXpRequired", Number(e.target.value))} />
        </Field>
        <Field label="Commitment Stake (XP)" hint="Locked at join, forfeited on inactivity.">
          <Input type="number" min={0} value={d.xpCommitmentStake} onChange={(e) => u("xpCommitmentStake", Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Visibility">
        <Select value={d.visibility} onValueChange={(v) => u("visibility", v as ProjectVisibility)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {VISIBILITY.map((v) => <SelectItem key={v} value={v} className="capitalize">{v.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Required skills (comma-separated)">
        <Input value={d.requiredSkills} onChange={(e) => u("requiredSkills", e.target.value)} placeholder="figma, react, copywriting" />
      </Field>
      <Field label="Allowed institutions (comma-separated, blank = all)">
        <Input value={d.allowedInstitutions} onChange={(e) => u("allowedInstitutions", e.target.value)} placeholder="IIT Bombay, NID Ahmedabad" />
      </Field>
    </div>
  );
}

function Step3({ d, u }: { d: Draft; u: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  function updateRole(idx: number, patch: Partial<ProjectRoleSpec>) {
    u("roles", d.roles.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Project roles</h2>
        <Button size="sm" variant="outline" onClick={() => u("roles", [...d.roles, emptyRole()])}>
          <Plus className="mr-1 h-4 w-4" /> Add role
        </Button>
      </div>
      {d.roles.map((r, i) => (
        <Card key={r.id} className="border-border/70 p-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">Role #{i + 1}</Badge>
            {d.roles.length > 1 && (
              <Button size="icon" variant="ghost" onClick={() => u("roles", d.roles.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Role name">
              <Input value={r.roleName} onChange={(e) => updateRole(i, { roleName: e.target.value })} placeholder="UI Designer" />
            </Field>
            <Field label="Seats">
              <Input type="number" min={1} value={r.roleCount} onChange={(e) => updateRole(i, { roleCount: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="mt-3 grid gap-3">
            <Field label="Role description">
              <Textarea rows={2} value={r.roleDescription} onChange={(e) => updateRole(i, { roleDescription: e.target.value })} />
            </Field>
            <Field label="Deliverables">
              <Textarea rows={2} value={r.deliverables} onChange={(e) => updateRole(i, { deliverables: e.target.value })} />
            </Field>
            <Field label="Success criteria">
              <Textarea rows={2} value={r.successCriteria} onChange={(e) => updateRole(i, { successCriteria: e.target.value })} />
            </Field>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Step4({ d, u }: { d: Draft; u: <K extends keyof Draft>(k: K, v: Draft[K]) => void }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold">Reward configuration</h2>
      <Field label="Reward pool (XP)">
        <Input type="number" min={0} value={d.rewardPoolXp} onChange={(e) => u("rewardPoolXp", Number(e.target.value))} />
      </Field>
      <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
        <div>
          <Label>Bonus rewards enabled</Label>
          <p className="text-xs text-muted-foreground">Top contributors receive an additional bonus from the pool.</p>
        </div>
        <Switch checked={d.bonusRewardEnabled} onCheckedChange={(v) => u("bonusRewardEnabled", v)} />
      </div>
      <Field label="Distribution method">
        <Select value={d.rewardDistributionMethod} onValueChange={(v) => u("rewardDistributionMethod", v as RewardDistributionMethod)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {REWARD_METHODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
