import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Plus, Users, Clock, Award, Sparkles, Crown } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStoreValue } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import {
  challengeArena, canCreateChallenge, type Challenge,
} from "@/lib/challenge-arena-store";

export const Route = createFileRoute("/challenges-arena")({
  head: () => ({
    meta: [
      { title: "Skill Validation Challenges — Scope Connect" },
      { name: "description", content: "Competitive skill-validation challenges with XP commitment, leaderboards and verifiable rewards." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: ChallengeArenaListPage,
});

function ChallengeArenaListPage() {
  const role = useRole();
  const list = useStoreValue(() => challengeArena.challenges.listPublic());
  const canCreate = canCreateChallenge(role);

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">
              <Sparkles className="mr-1 h-3 w-3" /> Challenge Engine · Additive
            </Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Skill Validation Challenges
            </h1>
            <p className="mt-2 max-w-2xl text-primary-foreground/70">
              Commit XP, submit before the deadline, and climb the leaderboard. Non-submission triggers full Commitment Forfeiture.
            </p>
          </div>
          {canCreate && (
            <Button asChild className="bg-gradient-brand text-brand-foreground">
              <Link to="/challenges-arena/new"><Plus className="mr-2 h-4 w-4" /> Create challenge</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No challenges yet</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Challenges are skill-validation contests with XP stake, ranked leaderboards and recruiter-trust signals.
            </p>
            {canCreate && (
              <Button asChild className="mt-2">
                <Link to="/challenges-arena/new"><Plus className="mr-2 h-4 w-4" /> Create the first one</Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => <ChallengeTile key={c.id} c={c} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function ChallengeTile({ c }: { c: Challenge }) {
  const participants = useStoreValue(() => challengeArena.participants.forChallenge(c.id).length);
  const submissions = useStoreValue(() => challengeArena.submissions.forChallenge(c.id).length);
  const daysToDeadline = Math.max(0, Math.ceil((c.challengeDeadline - Date.now()) / 86400000));
  const expired = Date.now() > c.challengeDeadline;

  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className="capitalize">{c.challengeType.replace(/_/g, " ")}</Badge>
        <Badge variant={expired ? "destructive" : "secondary"} className="capitalize">
          {c.status.replace(/_/g, " ")}
        </Badge>
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-foreground">{c.challengeTitle}</h3>
      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{c.challengeDescription}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Mini icon={Users} label="Joined" value={`${participants}`} />
        <Mini icon={Clock} label="Days left" value={expired ? "ended" : `${daysToDeadline}d`} />
        <Mini icon={Award} label="Pool" value={`${c.rewardPoolXp} XP`} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span><Crown className="mr-1 inline h-3 w-3" /> Stake: {c.commitmentStakeXp} XP</span>
        <span>{submissions} submissions</span>
      </div>

      <div className="mt-auto pt-4">
        <Button asChild variant="outline" className="w-full">
          <Link to="/challenges-arena/$challengeId" params={{ challengeId: c.id }}>View challenge</Link>
        </Button>
      </div>
    </Card>
  );
}

function Mini({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2">
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
