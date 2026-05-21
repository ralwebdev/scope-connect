import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Briefcase, ShieldCheck, ShieldAlert, Crown, ChevronLeft,
  CheckCircle2, XCircle, Send, Users, Award, Activity, Building2, MapPin, Trophy,
} from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useUser, useStoreValue, useXP, useLevel } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import {
  opportunityEngine,
  type EligibilityContext,
  type ApplicationStatus,
} from "@/lib/opportunity-engine-store";
import { toast } from "sonner";

export const Route = createFileRoute("/opportunities-hub/$opportunityId")({
  head: () => ({
    meta: [
      { title: "Opportunity — Scope Connect" },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: OpportunityDetailPage,
});

function OpportunityDetailPage() {
  const { opportunityId } = Route.useParams();
  const navigate = useNavigate();
  const role = useRole();
  const user = useUser();
  const xp = useXP();
  const level = useLevel();

  const o = useStoreValue(() => opportunityEngine.opportunities.byId(opportunityId));
  const applicationsList = useStoreValue(() => opportunityEngine.applications.byOpportunity(opportunityId));
  const hasApplied = useStoreValue(() =>
    user ? opportunityEngine.applications.hasApplied(user.id, opportunityId) : false
  );

  const ctx: EligibilityContext = useMemo(() => ({
    userId: user?.id ?? "anon",
    userRole: role,
    userName: user?.name,
    userInstitution: undefined,
    userDepartment: undefined,
    userSkills: [],
    userXp: xp,
    userXpLevel: levelOrdinal(level?.name),
    userReliability: 75,
    userProjectsCompleted: 2,
    userAverageContribution: 70,
    userChallengePerformance: 60,
    userPeerReputation: 70,
  }), [user, role, xp, level]);

  if (!o) {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Card className="p-10">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold">Opportunity not found</h1>
            <Button asChild className="mt-6">
              <Link to="/opportunities-hub">Back to hub</Link>
            </Button>
          </Card>
        </section>
      </AppShell>
    );
  }

  const eligibility = opportunityEngine.evaluateOpportunityEligibility(o, ctx);
  const meritScore = opportunityEngine.computeMeritScore(ctx);
  const eligible = eligibility.every(r => r.passed);
  const onCooldown = opportunityEngine.cooldown.isUserOnCooldown(ctx.userId);
  const canReview = opportunityEngine.canReviewApplications(role, o, ctx.userId);

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-10 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-4 text-primary-foreground/80 hover:text-primary-foreground">
            <Link to="/opportunities-hub"><ChevronLeft className="mr-1 h-4 w-4" /> Back to hub</Link>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary-foreground/30 capitalize text-primary-foreground">
                  {o.opportunityType.replace(/_/g, " ")}
                </Badge>
                {o.isPremium && (
                  <Badge className="bg-gradient-brand text-brand-foreground">
                    <Crown className="mr-1 h-3 w-3" /> Premium
                  </Badge>
                )}
                <Badge variant="outline" className="border-primary-foreground/30 capitalize text-primary-foreground">
                  {o.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{o.opportunityTitle}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-primary-foreground/70">
                {o.organizationName && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {o.organizationName}</span>}
                {o.mode && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {o.mode}{o.location ? ` · ${o.location}` : ""}</span>}
                {o.duration && <span>· {o.duration}</span>}
              </div>
            </div>
            <Card className="bg-background/95 p-4 text-foreground">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Your merit score</p>
              <p className="mt-1 text-3xl font-bold">{meritScore}<span className="text-base font-normal text-muted-foreground">/100</span></p>
              <Progress value={meritScore} className="mt-2 w-48" />
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apply">Eligibility &amp; apply</TabsTrigger>
            <TabsTrigger value="trust">Trust profile</TabsTrigger>
            {canReview && <TabsTrigger value="applicants">Applicants ({applicationsList.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="p-5 lg:col-span-2">
                <h2 className="text-lg font-semibold">About this opportunity</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{o.description}</p>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold">Eligibility thresholds</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Reliability ≥ {o.minimumReliabilityScore}</li>
                  <li className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> XP ≥ {o.minimumXpRequired}</li>
                  <li className="flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Projects ≥ {o.minimumProjectCompletionCount}</li>
                  <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Contribution ≥ {o.minimumContributionScore}</li>
                </ul>
                <div className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  Selection: <span className="capitalize text-foreground">{o.selectionMethod.replace(/_/g, " ")}</span>
                  {o.maxCandidates ? <> · Max {o.maxCandidates}</> : null}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apply" className="mt-6">
            <ApplyPanel
              opportunityId={o.id}
              ctx={ctx}
              eligibility={eligibility}
              eligible={eligible}
              onCooldown={onCooldown}
              hasApplied={hasApplied}
              requireSoi={o.requireStatementOfInterest}
              requirePortfolio={o.requirePortfolioLinks}
              onDone={() => navigate({ to: "/opportunities-hub/$opportunityId", params: { opportunityId: o.id } })}
            />
          </TabsContent>

          <TabsContent value="trust" className="mt-6">
            <TrustProfilePanel ctx={ctx} />
          </TabsContent>

          {canReview && (
            <TabsContent value="applicants" className="mt-6">
              <ApplicantsPanel opportunityId={o.id} />
            </TabsContent>
          )}
        </Tabs>
      </section>
    </AppShell>
  );
}

function ApplyPanel({
  opportunityId, ctx, eligibility, eligible, onCooldown, hasApplied,
  requireSoi, requirePortfolio, onDone,
}: {
  opportunityId: string;
  ctx: EligibilityContext;
  eligibility: ReturnType<typeof opportunityEngine.evaluateOpportunityEligibility>;
  eligible: boolean;
  onCooldown: boolean;
  hasApplied: boolean;
  requireSoi: boolean;
  requirePortfolio: boolean;
  onDone: () => void;
}) {
  const [statement, setStatement] = useState("");
  const [portfolio, setPortfolio] = useState("");

  function submit() {
    const links = portfolio.split(",").map(s => s.trim()).filter(Boolean);
    const res = opportunityEngine.applyForOpportunity({
      opportunityId,
      ctx,
      statementOfInterest: statement,
      portfolioLinks: links,
    });
    if (res.ok) {
      toast.success("Application submitted", { description: "Your merit snapshot was recorded." });
      onDone();
    } else {
      const description =
        res.reason === "missing_statement"
          ? "Statement of interest must be at least 20 characters."
          : res.reason === "already_applied"
          ? "You have already applied to this opportunity."
          : res.reason === "not_eligible"
          ? "Eligibility checks did not pass."
          : "This opportunity is not currently accepting applications.";
      toast.error("Could not submit", { description });
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-lg font-semibold">Eligibility checks</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {eligibility.map(r => (
            <li key={r.id} className="flex items-start gap-2">
              {r.passed
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                : <XCircle className="mt-0.5 h-4 w-4 text-destructive" />}
              <div className="flex-1">
                <p className={r.passed ? "text-foreground" : "font-medium text-destructive"}>{r.label}</p>
                {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
              </div>
            </li>
          ))}
        </ul>
        {onCooldown && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-destructive" />
            <p>You are currently on a cooldown. Premium opportunities and applications are restricted until it expires.</p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Submit application</h3>
        {hasApplied ? (
          <p className="mt-4 text-sm text-muted-foreground">You have already applied to this opportunity.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {requireSoi && (
              <div>
                <Label htmlFor="soi">Statement of interest *</Label>
                <Textarea id="soi" rows={5} value={statement} onChange={e => setStatement(e.target.value)} maxLength={2000} />
                <p className="mt-1 text-xs text-muted-foreground">{statement.trim().length}/20 minimum</p>
              </div>
            )}
            {requirePortfolio && (
              <div>
                <Label htmlFor="port">Portfolio links (comma-separated)</Label>
                <Input id="port" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://..." />
              </div>
            )}
            <Button
              onClick={submit}
              disabled={!eligible || onCooldown || (requireSoi && statement.trim().length < 20)}
              className="bg-gradient-brand text-brand-foreground"
            >
              <Send className="mr-1 h-4 w-4" /> Submit application
            </Button>
            {!eligible && <p className="text-xs text-muted-foreground">All eligibility checks must pass before you can apply.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

function TrustProfilePanel({ ctx }: { ctx: EligibilityContext }) {
  const { positive, negative } = opportunityEngine.deriveTrustTags(ctx);
  const merit = opportunityEngine.computeMeritScore(ctx);
  const onCooldown = opportunityEngine.cooldown.isUserOnCooldown(ctx.userId);

  const metrics = [
    { label: "Reliability", value: ctx.userReliability, max: 100 },
    { label: "Projects completed", value: ctx.userProjectsCompleted, max: 10 },
    { label: "Avg contribution", value: ctx.userAverageContribution, max: 100 },
    { label: "XP level", value: ctx.userXpLevel, max: 20 },
    { label: "Challenge performance", value: ctx.userChallengePerformance, max: 100 },
    { label: "Peer reputation", value: ctx.userPeerReputation, max: 100 },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-lg font-semibold">Recruiter trust metrics</h3>
        <p className="mt-1 text-xs text-muted-foreground">Merit total: {merit}/100</p>
        <div className="mt-4 space-y-3">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-sm">
                <span>{m.label}</span>
                <span className="text-muted-foreground">{m.value}/{m.max}</span>
              </div>
              <Progress value={Math.min(100, (m.value / m.max) * 100)} className="mt-1" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-lg font-semibold">Trust signals</h3>
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Positive</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {positive.length === 0 && <span className="text-xs text-muted-foreground">No positive tags yet</span>}
            {positive.map(t => (
              <Badge key={t} className="bg-green-500/15 text-green-600 hover:bg-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" /> {t}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Warnings</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {negative.length === 0 && !onCooldown && <span className="text-xs text-muted-foreground">No warnings</span>}
            {negative.map(t => (
              <Badge key={t} variant="destructive">
                <ShieldAlert className="mr-1 h-3 w-3" /> {t}
              </Badge>
            ))}
            {onCooldown && (
              <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" /> Active cooldown</Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ApplicantsPanel({ opportunityId }: { opportunityId: string }) {
  const list = useStoreValue(() => opportunityEngine.applications.byOpportunity(opportunityId));

  function setStatus(id: string, status: ApplicationStatus) {
    opportunityEngine.applications.setStatus(id, status);
    toast.success("Application updated", { description: `Marked as ${status.replace(/_/g, " ")}` });
  }

  if (list.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No applications yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {list.map(a => (
        <Card key={a.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{a.userName}</p>
                <Badge variant="outline" className="capitalize">{a.userRole.replace(/_/g, " ")}</Badge>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/20">Merit {a.meritSnapshot}</Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.statementOfInterest}</p>
              {a.portfolioLinks.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">{a.portfolioLinks.length} portfolio link(s)</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="capitalize">{a.status.replace(/_/g, " ")}</Badge>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "shortlisted")}>Shortlist</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "selected")}>Select</Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus(a.id, "rejected")}>Reject</Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
