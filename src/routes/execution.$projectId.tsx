import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Users, Lock, Trophy, Clock, Plus, ShieldAlert, Crown,
  CheckCircle2, AlertTriangle, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/site/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useStoreValue, useUser, useXP } from "@/hooks/use-scope";
import { useRole } from "@/hooks/use-rbac";
import {
  projectsExec, joinProject, submitTask, reviewTask,
  canCreateTask, canReviewTask, evaluateEligibility, isEligible,
  type ExecutionProject, type RoomParticipant, type ProjectTask,
  type TaskPriority, type TaskSubmissionEvidence, type TaskReviewAction,
} from "@/lib/projects-execution-store";
import { reliabilityEngine } from "@/lib/execution-engines";
import { ReportingPanel } from "@/components/execution/ReportingPanel";
import { ParticipantModerationActions } from "@/components/governance/ParticipantModerationActions";

export const Route = createFileRoute("/execution/$projectId")({
  head: ({ params }) => ({
    meta: [
      { title: `Execution Project — Scope Connect` },
      { name: "robots", content: "noindex,follow" },
      { rel: "canonical", href: `/execution/${params.projectId}` } as never,
    ],
  }),
  component: ExecutionProjectPage,
});

function ExecutionProjectPage() {
  const { projectId } = Route.useParams();
  const project = useStoreValue(() => projectsExec.projects.get(projectId));

  if (!project) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Project not found</h1>
          <Button asChild className="mt-4"><Link to="/execution">Back to projects</Link></Button>
        </section>
      </AppShell>
    );
  }
  return <ProjectDetail project={project} />;
}

function ProjectDetail({ project }: { project: ExecutionProject }) {
  const user = useUser();
  const role = useRole();
  const userXp = useXP();
  const participants = useStoreValue(() => projectsExec.participants.byProject(project.id));
  const rooms = useStoreValue(() => projectsExec.rooms.byProject(project.id));
  const tasks = useStoreValue(() => projectsExec.tasks.byProject(project.id));
  const logs = useStoreValue(() => projectsExec.logs.byProject(project.id));

  const myParticipant = user ? participants.find((p) => p.userId === user.id) : undefined;
  const isCoordinator = !!myParticipant?.isTemporaryCoordinator;
  const isFull = participants.filter((p) => p.status === "active").length >= project.participantsNeeded;
  const daysToDeadline = Math.max(0, Math.ceil((project.deadline - Date.now()) / 86400000));

  return (
    <AppShell>
      <section className="border-b border-border/40 bg-gradient-hero py-10 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/execution" className="text-xs text-primary-foreground/70 hover:text-primary-foreground">
            <ArrowLeft className="mr-1 inline h-3 w-3" /> Execution projects
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary-foreground/30 capitalize text-primary-foreground">
                  {project.projectType.replace("_", " ")}
                </Badge>
                <Badge className="bg-cyan/20 text-cyan-foreground capitalize">{project.status.replace(/_/g, " ")}</Badge>
                {isFull && <Badge variant="destructive"><Lock className="mr-1 h-3 w-3" /> Room locked</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{project.projectTitle}</h1>
              <p className="mt-2 max-w-3xl text-sm text-primary-foreground/70">{project.projectDescription}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <HeroStat icon={Users} value={`${participants.filter((p) => p.status === "active").length}/${project.participantsNeeded}`} label="Seats" />
              <HeroStat icon={Clock} value={`${daysToDeadline}d`} label="Deadline" />
              <HeroStat icon={Trophy} value={`${project.rewardPoolXp}`} label="Reward XP" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="room">Room</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="reporting">Reporting</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <OverviewPanel project={project} />
              </TabsContent>
              <TabsContent value="room" className="mt-4 space-y-4">
                <RoomPanel
                  project={project}
                  participants={participants}
                  rooms={rooms}
                  actor={user ? { id: user.id, name: user.name ?? user.email ?? "User", role, isTemporaryCoordinator: isCoordinator } : null}
                />
              </TabsContent>
              <TabsContent value="tasks" className="mt-4 space-y-4">
                <TasksPanel
                  project={project}
                  tasks={tasks}
                  participants={participants}
                  meIsCoordinator={isCoordinator}
                  myParticipantId={myParticipant?.id}
                />
              </TabsContent>
              <TabsContent value="reporting" className="mt-4 space-y-4">
                <ReportingPanel
                  project={project}
                  participants={participants}
                  myParticipant={myParticipant}
                  meIsCoordinator={isCoordinator}
                />
              </TabsContent>
              <TabsContent value="activity" className="mt-4 space-y-3">
                {logs.length === 0
                  ? <Card className="p-6 text-sm text-muted-foreground">No activity yet.</Card>
                  : logs.map((l) => (
                    <Card key={l.id} className="p-3 text-sm">
                      <span className="font-medium capitalize">{l.action.replace(/_/g, " ")}</span>
                      {l.note && <> — <span className="text-muted-foreground">{l.note}</span></>}
                      <span className="ml-2 text-xs text-muted-foreground">{new Date(l.at).toLocaleString()}</span>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4">
            <JoinPanel
              project={project}
              myParticipant={myParticipant}
              userContext={{
                userId: user?.id ?? "",
                userRole: role,
                userXp,
                userInstitution: undefined,
                userSkills: [],
                userReliability: user ? reliabilityEngine.score(user.id) : 100,
              }}
            />
            <CreatorPanel project={project} />
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function HeroStat({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return (
    <div className="rounded-md border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-2">
      <Icon className="mx-auto h-3.5 w-3.5 opacity-80" />
      <div className="mt-1 text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

function OverviewPanel({ project }: { project: ExecutionProject }) {
  return (
    <>
      <Card className="p-5">
        <h3 className="text-sm font-semibold">Expected outcomes</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{project.expectedOutcomes}</p>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold">Roles</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {project.roles.map((r) => (
            <div key={r.id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{r.roleName}</p>
                <Badge variant="outline">{r.roleCount} seat{r.roleCount > 1 ? "s" : ""}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{r.roleDescription}</p>
              <p className="mt-2 text-xs"><strong>Deliverables:</strong> {r.deliverables}</p>
              <p className="mt-1 text-xs"><strong>Success:</strong> {r.successCriteria}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function RoomPanel({
  project, participants, rooms, actor,
}: {
  project: ExecutionProject;
  participants: RoomParticipant[];
  rooms: ReturnType<typeof projectsExec.rooms.byProject>;
  actor: import("@/lib/moderation-governance-store").ActorContext | null;
}) {
  const room = rooms[0];
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Project room</h3>
          <p className="text-xs text-muted-foreground">{room ? room.roomName : "Room auto-creates on first join."}</p>
        </div>
        {room && (
          <Badge variant="outline" className="capitalize">
            {room.status}
          </Badge>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {participants.length === 0 && (
          <p className="text-sm text-muted-foreground">No participants yet.</p>
        )}
        {participants.map((p) => (
          <div key={p.id} className="rounded-md border border-border/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {p.userName}
                  {p.isTemporaryCoordinator && (
                    <Badge variant="secondary" className="ml-2"><Crown className="mr-1 h-3 w-3" /> Temporary Coordinator</Badge>
                  )}
                  <Badge variant="outline" className="ml-2 capitalize">{p.status}</Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.assignedRoleName ?? "No role assigned"} · {p.xpCommittedAmount} XP locked
                </p>
              </div>
              <Badge variant="outline">Joined {new Date(p.joinedAt).toLocaleDateString()}</Badge>
            </div>
            {actor && <ParticipantModerationActions participant={p} actor={actor} />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Capacity: {participants.filter((p) => p.status === "active").length} / {project.participantsNeeded}.
        Room locks when capacity is reached. Removed seats reopen automatically.
      </p>
    </Card>
  );
}

function JoinPanel({
  project, myParticipant, userContext,
}: {
  project: ExecutionProject;
  myParticipant?: RoomParticipant;
  userContext: Parameters<typeof evaluateEligibility>[1];
}) {
  const user = useUser();
  const role = useRole();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState<null | { roomName: string; wasFirst: boolean }>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(project.roles[0]?.id ?? "");

  const eligibility = useMemo(() => evaluateEligibility(project, userContext), [project, userContext]);
  const eligible = isEligible(eligibility);

  if (myParticipant) {
    return (
      <Card className="p-5">
        <Badge className="bg-success/15 text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> You're in</Badge>
        <h3 className="mt-2 text-sm font-semibold">Role: {myParticipant.assignedRoleName ?? "Unassigned"}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {myParticipant.xpCommittedAmount} Reputation XP committed. Stay active — inactivity triggers full forfeiture.
        </p>
        {myParticipant.isTemporaryCoordinator && (
          <Badge variant="secondary" className="mt-3">
            <Crown className="mr-1 h-3 w-3" /> Temporary Coordinator
          </Badge>
        )}
      </Card>
    );
  }

  function handleJoin() {
    if (!user) return toast.error("Sign in to join.");
    const wasFirst = projectsExec.participants.byProject(project.id).length === 0;
    const out = joinProject({
      project,
      user: { id: user.id, name: user.name, role },
      eligibility: userContext,
      assignedRoleId: selectedRoleId || undefined,
    });
    if (!out.ok) return toast.error(out.reason);
    toast.success(`Joined. ${out.commitment.amount} XP committed.`);
    setOpen(false);
    setSuccess({ roomName: out.room.roomName, wasFirst });
  }

  function enterRoom() {
    setSuccess(null);
    if (typeof document === "undefined") return;
    const trigger = document.querySelector<HTMLButtonElement>('[role="tab"][data-state][value="room"], [role="tab"][value="room"]');
    trigger?.click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Card className="p-5">
        <h3 className="text-sm font-semibold">Join this project</h3>
        <ul className="mt-3 space-y-1.5 text-xs">
          {eligibility.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              {c.passed
                ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                : <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
              <span className={c.passed ? "" : "text-muted-foreground"}>{c.label}</span>
              {c.note && <span className="text-[10px] text-muted-foreground">({c.note})</span>}
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full bg-gradient-brand text-brand-foreground" disabled={!eligible} onClick={() => setOpen(true)}>
          Commit {project.xpCommitmentStake} XP & join
        </Button>
        <p className="mt-2 text-[10px] text-muted-foreground">
          By joining you accept Commitment Forfeiture rules for inactivity.
        </p>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commitment Confirmation</DialogTitle>
            <DialogDescription>
              You are committing <strong>{project.xpCommitmentStake} Reputation XP</strong> to participate in this
              professional execution project. Failure to contribute or inactivity may result in full Commitment Forfeiture.
            </DialogDescription>
          </DialogHeader>

          {project.roles.length > 0 && (
            <div className="grid gap-2 py-2">
              <Label className="text-sm">Select a role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger><SelectValue placeholder="Pick a role" /></SelectTrigger>
                <SelectContent>
                  {project.roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.roleName} ({r.roleCount} seats)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-gradient-brand text-brand-foreground" onClick={handleJoin}>
              Confirm & lock XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!success} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {success?.wasFirst ? "Project Room Created" : "You've joined the Project Room"}
            </DialogTitle>
            <DialogDescription>
              {success?.wasFirst
                ? <>Your collaboration room <strong>{success?.roomName}</strong> has been created. You are now the <strong>Temporary Coordinator</strong> for this project.</>
                : <>You've been mapped into <strong>{success?.roomName}</strong>. Open the room to see participants and tasks.</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuccess(null)}>Stay here</Button>
            <Button className="bg-gradient-brand text-brand-foreground" onClick={enterRoom}>
              Enter Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreatorPanel({ project }: { project: ExecutionProject }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Created by</h3>
      <p className="mt-1 text-sm">{project.createdByName}</p>
      <p className="text-xs text-muted-foreground capitalize">{project.createdByRole.replace(/_/g, " ")}</p>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Visibility: <span className="capitalize">{project.visibility.replace(/_/g, " ")}</span>
        {" · "}Distribution: <span className="capitalize">{project.rewardDistributionMethod.replace(/_/g, " ")}</span>
      </p>
    </Card>
  );
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];

function TasksPanel({
  project, tasks, participants, meIsCoordinator, myParticipantId,
}: {
  project: ExecutionProject;
  tasks: ProjectTask[];
  participants: RoomParticipant[];
  meIsCoordinator: boolean;
  myParticipantId?: string;
}) {
  const role = useRole();
  const user = useUser();
  const canCreate = canCreateTask(role, meIsCoordinator);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Tasks <Badge variant="outline" className="ml-1">{tasks.length}</Badge></h3>
            <p className="text-xs text-muted-foreground">Micro-execution units under this project.</p>
          </div>
          {canCreate && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create task
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {tasks.length === 0 && (
            <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              <ListChecks className="mx-auto h-6 w-6" />
              <p className="mt-2">No tasks yet.</p>
            </div>
          )}
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              isAssignee={!!user && t.assignedToUserId === user.id}
              canReview={canReviewTask(role, meIsCoordinator)}
            />
          ))}
        </div>
      </Card>

      <CreateTaskDialog
        open={open}
        onOpenChange={setOpen}
        project={project}
        participants={participants}
        myParticipantId={myParticipantId}
      />
    </>
  );
}

function statusTone(s: ProjectTask["status"]) {
  if (s === "completed") return "bg-success/15 text-success";
  if (s === "failed") return "bg-destructive/15 text-destructive";
  if (s === "rework_required") return "bg-warning/15 text-warning";
  if (s === "submitted" || s === "under_review") return "bg-cyan/15 text-cyan";
  return "";
}

function TaskRow({
  task, isAssignee, canReview,
}: { task: ProjectTask; isAssignee: boolean; canReview: boolean }) {
  const user = useUser();
  const role = useRole();
  const [subOpen, setSubOpen] = useState(false);
  const submissions = useStoreValue(() => projectsExec.submissions.byTask(task.id));
  const reviews = useStoreValue(() => projectsExec.reviews.byTask(task.id));

  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{task.taskTitle}</p>
            <Badge variant="outline" className="capitalize">{task.priority}</Badge>
            <Badge className={`capitalize ${statusTone(task.status)}`}>{task.status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Assigned to <strong>{task.assignedToName}</strong> · due {new Date(task.deadline).toLocaleDateString()}
          </p>
          {task.taskDescription && <p className="mt-2 text-xs">{task.taskDescription}</p>}
        </div>
        <div className="flex gap-2">
          {isAssignee && (task.status === "assigned" || task.status === "in_progress" || task.status === "rework_required") && (
            <Button size="sm" onClick={() => setSubOpen(true)}>Submit</Button>
          )}
        </div>
      </div>

      {submissions.length > 0 && (
        <div className="mt-3 space-y-2">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-md bg-muted/40 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span><strong>{s.submittedByName}</strong> submitted {new Date(s.submittedAt).toLocaleString()}</span>
                {canReview && (
                  <ReviewActions task={task} />
                )}
              </div>
              {s.note && <p className="mt-1 text-muted-foreground">{s.note}</p>}
              <ul className="mt-1 list-disc pl-4">
                {s.evidence.map((e, idx) => (
                  <li key={idx}><span className="capitalize">{e.kind.replace(/_/g, " ")}:</span> {e.value}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          {reviews.map((r) => (
            <div key={r.id}>
              <ShieldAlert className="mr-1 inline h-3 w-3" />
              <strong>{r.reviewerName}</strong> ({r.reviewerRole.replace(/_/g, " ")}) ·{" "}
              <span className="capitalize">{r.action.replace(/_/g, " ")}</span>
              {r.note && <> — {r.note}</>}
            </div>
          ))}
        </div>
      )}

      {isAssignee && (
        <SubmitTaskDialog
          open={subOpen}
          onOpenChange={setSubOpen}
          task={task}
          user={user ? { id: user.id, name: user.name } : undefined}
        />
      )}
      <span className="sr-only">{role}</span>
    </div>
  );
}

function ReviewActions({ task }: { task: ProjectTask }) {
  const user = useUser();
  const role = useRole();
  const participants = useStoreValue(() => projectsExec.participants.byProject(task.projectId));
  const meIsCoord = !!user && !!participants.find((p) => p.userId === user.id && p.isTemporaryCoordinator);

  function act(action: TaskReviewAction) {
    if (!user) return toast.error("Sign in required.");
    const out = reviewTask({
      taskId: task.id,
      reviewer: { id: user.id, name: user.name, role, isTemporaryCoordinator: meIsCoord },
      action,
    });
    if (!out.ok) return toast.error(out.reason);
    toast.success(`Task marked ${action.replace(/_/g, " ")}.`);
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={() => act("approve")}>Approve</Button>
      <Button size="sm" variant="outline" onClick={() => act("request_rework")}>Rework</Button>
      <Button size="sm" variant="outline" className="text-success" onClick={() => act("mark_complete")}>Complete</Button>
      <Button size="sm" variant="outline" className="text-destructive" onClick={() => act("reject")}>Reject</Button>
    </div>
  );
}

function CreateTaskDialog({
  open, onOpenChange, project, participants, myParticipantId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ExecutionProject;
  participants: RoomParticipant[];
  myParticipantId?: string;
}) {
  const user = useUser();
  const role = useRole();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState<string>("");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deliverables, setDeliverables] = useState("");

  const eligible = participants.filter((p) => p.status === "active");
  const meIsCoord = !!myParticipantId && !!eligible.find((p) => p.id === myParticipantId)?.isTemporaryCoordinator;

  function create() {
    if (!user) return toast.error("Sign in required.");
    if (!title.trim() || !desc.trim() || !assignee) return toast.error("Title, description and assignee are required.");
    if (!canCreateTask(role, meIsCoord)) return toast.error("You cannot create tasks here.");
    const target = eligible.find((p) => p.id === assignee);
    if (!target) return toast.error("Pick a valid assignee.");
    const room = projectsExec.rooms.byProject(project.id)[0];
    if (!room) return toast.error("Project room not ready.");
    projectsExec.tasks.create({
      projectId: project.id,
      roomId: room.id,
      taskTitle: title.trim(),
      taskDescription: desc.trim(),
      assignedToUserId: target.userId,
      assignedToName: target.userName,
      deadline: new Date(deadline).getTime(),
      priority,
      deliverables: deliverables.trim() || undefined,
      createdByUserId: user.id,
      createdByName: user.name,
      createdByRole: role,
    });
    toast.success("Task created.");
    onOpenChange(false);
    setTitle(""); setDesc(""); setAssignee(""); setDeliverables("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Assign a deliverable unit under this project room.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Task title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Assigned to</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger><SelectValue placeholder="Pick participant" /></SelectTrigger>
                <SelectContent>
                  {eligible.length === 0 && <SelectItem value="__none" disabled>No participants yet</SelectItem>}
                  {eligible.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.userName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Deliverables (optional)</Label>
            <Textarea rows={2} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EVIDENCE_KINDS: TaskSubmissionEvidence["kind"][] = [
  "github_link", "behance_link", "figma_link", "google_drive_link",
  "portfolio_link", "screenshots", "comments", "text_submission", "file_upload",
];

function SubmitTaskDialog({
  open, onOpenChange, task, user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: ProjectTask;
  user?: { id: string; name: string };
}) {
  const [kind, setKind] = useState<TaskSubmissionEvidence["kind"]>("github_link");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  function submit() {
    if (!user) return toast.error("Sign in required.");
    if (!value.trim()) return toast.error("Provide evidence value.");
    const out = submitTask({
      taskId: task.id,
      submittedBy: user,
      evidence: [{ kind, value: value.trim() }],
      note: note.trim() || undefined,
    });
    if (!out.ok) return toast.error(out.reason);
    toast.success("Submitted for review.");
    onOpenChange(false);
    setValue(""); setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit task</DialogTitle>
          <DialogDescription>{task.taskTitle}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Evidence type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as TaskSubmissionEvidence["kind"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVIDENCE_KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Value (link or text)</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://… or your submission" />
          </div>
          <div className="grid gap-1.5">
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
