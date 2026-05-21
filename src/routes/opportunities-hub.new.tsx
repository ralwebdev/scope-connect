import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Save, ShieldX } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import {
  opportunityEngine,
  type OpportunityType,
  type OpportunityMode,
  type SelectionMethod,
} from "@/lib/opportunity-engine-store";

export const Route = createFileRoute("/opportunities-hub/new")({
  head: () => ({
    meta: [
      { title: "Create Opportunity — Scope Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: NewOpportunityPage,
});

const TYPES: OpportunityType[] = [
  "internship","placement","startup_role","research",
  "campus_leadership","competition","scope_magazine",
  "innovation_lab","mentorship","ambassador_program",
  "freelance","scholarship","faculty_assistantship",
  "industry_collaboration","hackathon","chapter_operations",
  "project_based","custom",
];
const MODES: OpportunityMode[] = ["remote", "hybrid", "onsite"];
const SELECTION: SelectionMethod[] = [
  "direct_selection", "application_review", "faculty_review",
  "score_based_auto_selection", "hybrid",
];

function NewOpportunityPage() {
  const role = useRole();
  const user = useUser();
  const navigate = useNavigate();
  const canCreate = opportunityEngine.canCreateOpportunity(role);

  const [step, setStep] = useState(1);
  // Step 1
  const [title, setTitle] = useState("");
  const [type, setType] = useState<OpportunityType>("internship");
  const [org, setOrg] = useState("");
  const [desc, setDesc] = useState("");
  const [duration, setDuration] = useState("");
  const [mode, setMode] = useState<OpportunityMode>("remote");
  const [location, setLocation] = useState("");
  // Step 2
  const [minRel, setMinRel] = useState(70);
  const [minXp, setMinXp] = useState(0);
  const [minProjects, setMinProjects] = useState(0);
  const [minContrib, setMinContrib] = useState(70);
  const [requiredSkills, setRequiredSkills] = useState("");
  const [allowedInstitutions, setAllowedInstitutions] = useState("");
  const [allowedDepartments, setAllowedDepartments] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  // Step 3
  const [selection, setSelection] = useState<SelectionMethod>("application_review");
  const [maxCandidates, setMaxCandidates] = useState<number | "">("");
  const [requireSoi, setRequireSoi] = useState(true);
  const [requirePortfolio, setRequirePortfolio] = useState(true);

  if (!canCreate) {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Card className="p-10">
            <ShieldX className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold">Restricted</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Only Institution Admins, Scope Admins and Super Admins can create opportunities.
            </p>
            <Button asChild className="mt-6"><Link to="/opportunities-hub">Back to hub</Link></Button>
          </Card>
        </section>
      </AppShell>
    );
  }

  const splitCsv = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);

  function publish() {
    const created = opportunityEngine.opportunities.create({
      opportunityTitle: title.trim(),
      opportunityType: type,
      organizationName: org.trim() || undefined,
      description: desc.trim(),
      duration: duration.trim() || undefined,
      mode,
      location: location.trim() || undefined,
      minimumReliabilityScore: minRel,
      minimumXpRequired: minXp,
      minimumProjectCompletionCount: minProjects,
      minimumContributionScore: minContrib,
      requiredSkills: splitCsv(requiredSkills),
      allowedInstitutions: splitCsv(allowedInstitutions),
      allowedDepartments: splitCsv(allowedDepartments),
      selectionMethod: selection,
      maxCandidates: typeof maxCandidates === "number" ? maxCandidates : undefined,
      requireStatementOfInterest: requireSoi,
      requirePortfolioLinks: requirePortfolio,
      isPremium,
      createdByUserId: user?.id ?? "anon",
      createdByName: user?.name ?? "Anonymous",
      createdByRole: role,
      status: "applications_open",
    });
    navigate({ to: "/opportunities-hub/$opportunityId", params: { opportunityId: created.id } });
  }

  const canNext1 = title.trim().length >= 4 && desc.trim().length >= 20;
  const canPublish = canNext1;

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Badge variant="outline">Step {step} of 3</Badge>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Create opportunity</h1>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/opportunities-hub"><ChevronLeft className="mr-1 h-4 w-4" /> Back</Link>
          </Button>
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Opportunity title *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Type *</Label>
                  <Select value={type} onValueChange={(v) => setType(v as OpportunityType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="org">Organization</Label>
                  <Input id="org" value={org} onChange={e => setOrg(e.target.value)} maxLength={120} />
                </div>
              </div>
              <div>
                <Label htmlFor="desc">Description *</Label>
                <Textarea id="desc" value={desc} onChange={e => setDesc(e.target.value)} rows={5} maxLength={2000} />
                <p className="mt-1 text-xs text-muted-foreground">Min 20 characters.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 months" />
                </div>
                <div>
                  <Label>Mode</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as OpportunityMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODES.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField label="Min reliability score" value={minRel} onChange={setMinRel} min={0} max={100} />
                <NumberField label="Min XP" value={minXp} onChange={setMinXp} min={0} max={100000} />
                <NumberField label="Min completed projects" value={minProjects} onChange={setMinProjects} min={0} max={100} />
                <NumberField label="Min contribution score" value={minContrib} onChange={setMinContrib} min={0} max={100} />
              </div>
              <div>
                <Label>Required skills (comma-separated)</Label>
                <Input value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="react, design, writing" />
              </div>
              <div>
                <Label>Allowed institutions (comma-separated)</Label>
                <Input value={allowedInstitutions} onChange={e => setAllowedInstitutions(e.target.value)} placeholder="Leave empty for all" />
              </div>
              <div>
                <Label>Allowed departments (comma-separated)</Label>
                <Input value={allowedDepartments} onChange={e => setAllowedDepartments(e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Mark as premium opportunity</p>
                  <p className="text-xs text-muted-foreground">Adds an extra gating layer: reliability ≥ 80, projects ≥ 3, avg contribution ≥ 75.</p>
                </div>
                <Switch checked={isPremium} onCheckedChange={setIsPremium} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <div>
                <Label>Selection method</Label>
                <Select value={selection} onValueChange={(v) => setSelection(v as SelectionMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SELECTION.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <NumberField
                label="Max candidates (optional)"
                value={typeof maxCandidates === "number" ? maxCandidates : 0}
                onChange={(v) => setMaxCandidates(v > 0 ? v : "")}
                min={0}
                max={10000}
              />
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <p className="text-sm font-medium">Require statement of interest</p>
                <Switch checked={requireSoi} onCheckedChange={setRequireSoi} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <p className="text-sm font-medium">Require portfolio links</p>
                <Switch checked={requirePortfolio} onCheckedChange={setRequirePortfolio} />
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1))}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !canNext1}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={publish} disabled={!canPublish} className="bg-gradient-brand text-brand-foreground">
                <Save className="mr-1 h-4 w-4" /> Publish opportunity
              </Button>
            )}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function NumberField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (n: number) => void; min: number; max: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
    </div>
  );
}
