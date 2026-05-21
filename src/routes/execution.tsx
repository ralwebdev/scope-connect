import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Rocket, Plus, Users, Clock, Trophy, Lock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStoreValue } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import { projectsExec, canCreateProject, type ExecutionProject } from "@/lib/projects-execution-store";

export const Route = createFileRoute("/execution")({
  head: () => ({
    meta: [
      { title: "Execution Projects — Scope Connect" },
      { name: "description", content: "Collaborative execution projects with room orchestration, XP commitment and contribution scoring." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: ExecutionListPage,
});

function ExecutionListPage() {
  const role = useRole();
  const projects = useStoreValue(() => projectsExec.projects.listPublic());
  const canCreate = canCreateProject(role);

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20">
              <Sparkles className="mr-1 h-3 w-3" /> Execution Engine · Additive
            </Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Collaborative Execution Projects
            </h1>
            <p className="mt-2 max-w-2xl text-primary-foreground/70">
              Commit Reputation XP, join a project room, deliver tasks and earn from the reward pool.
              Inactivity triggers full Commitment Forfeiture.
            </p>
          </div>
          {canCreate && (
            <Button asChild className="bg-gradient-brand text-brand-foreground">
              <Link to="/execution/new">
                <Plus className="mr-2 h-4 w-4" /> Create execution project
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {projects.length === 0 ? (
          <EmptyState canCreate={canCreate} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <ProjectTile key={p.id} project={p} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <Rocket className="h-10 w-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">No execution projects yet</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Execution projects are collaborative, room-based work units with XP commitment and contribution scoring.
      </p>
      {canCreate && (
        <Button asChild className="mt-2">
          <Link to="/execution/new"><Plus className="mr-2 h-4 w-4" /> Create the first one</Link>
        </Button>
      )}
    </Card>
  );
}

function ProjectTile({ project }: { project: ExecutionProject }) {
  const stats = useMemo(() => {
    const active = projectsExec.participants.activeCountFor(project.id);
    return { active, capacity: project.participantsNeeded };
  }, [project.id, project.participantsNeeded]);

  const full = stats.active >= stats.capacity;
  const daysToDeadline = Math.max(0, Math.ceil((project.deadline - Date.now()) / 86400000));

  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className="capitalize">{project.projectType.replace("_", " ")}</Badge>
        <Badge variant={full ? "destructive" : "secondary"} className="capitalize">
          {full ? <><Lock className="mr-1 h-3 w-3" /> locked</> : project.status.replace(/_/g, " ")}
        </Badge>
      </div>
      <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-foreground">{project.projectTitle}</h3>
      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{project.projectDescription}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Mini icon={Users} label="Seats" value={`${stats.active}/${stats.capacity}`} />
        <Mini icon={Clock} label="Days left" value={`${daysToDeadline}d`} />
        <Mini icon={Trophy} label="Pool" value={`${project.rewardPoolXp} XP`} />
      </div>

      <div className="mt-auto pt-4">
        <Button asChild variant="outline" className="w-full">
          <Link to="/execution/$projectId" params={{ projectId: project.id }}>View project</Link>
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
