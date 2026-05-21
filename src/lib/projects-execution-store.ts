// Scope Connect — Execution Ecosystem (Part 2): Project + Room + Task store.
// Strict additive: localStorage-backed, no edits to existing modules.
// Mirrors governance-store / execution-store conventions so a future MERN
// backend can swap `read`/`write` without touching consumers.

import type { RoleId } from "./rbac";
import { EXECUTION_CONSTANTS, canCreate } from "./execution-constants";

/* ------------------------------- Types -------------------------------- */

export type ID = string;
export type UnixMs = number;

export type ProjectStatus =
  | "draft" | "published" | "open_for_participation" | "room_forming"
  | "active" | "under_review" | "completed" | "cancelled" | "expired";

export type ProjectVisibility = "public" | "institution_only" | "invite_only";
export type ProjectDifficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type ProjectType =
  | "design" | "development" | "content" | "marketing" | "business"
  | "research" | "media" | "magazine" | "startup" | "innovation"
  | "cross_domain" | "custom";

export type ProjectRoleSpec = {
  id: ID;
  roleName: string;
  roleCount: number;
  roleDescription: string;
  deliverables: string;
  successCriteria: string;
};

export type RewardDistributionMethod = "weighted_contribution" | "equal_distribution";

export type ExecutionProject = {
  id: ID;
  slug: string;
  status: ProjectStatus;
  // Step 1
  projectTitle: string;
  projectType: ProjectType;
  projectDescription: string;
  expectedOutcomes: string;
  difficultyLevel?: ProjectDifficulty;
  durationDays: number;
  deadline: UnixMs;
  // Step 2
  participantsNeeded: number;
  minimumXpRequired: number;
  xpCommitmentStake: number;
  allowedInstitutions?: string[];
  requiredSkills?: string[];
  visibility: ProjectVisibility;
  // Step 3
  roles: ProjectRoleSpec[];
  // Step 4
  rewardPoolXp: number;
  bonusRewardEnabled: boolean;
  rewardDistributionMethod: RewardDistributionMethod;
  // Meta
  createdByUserId: ID;
  createdByName: string;
  createdByRole: RoleId;
  createdAt: UnixMs;
  updatedAt: UnixMs;
};

export type RoomStatus = "forming" | "ready" | "locked" | "active" | "review" | "completed" | "archived";

export type ExecutionRoom = {
  id: ID;
  roomName: string;
  projectId: ID;
  status: RoomStatus;
  temporaryCoordinatorUserId?: ID;
  temporaryCoordinatorName?: string;
  createdAt: UnixMs;
  updatedAt: UnixMs;
};

export type RoomParticipantStatus = "active" | "inactive" | "removed" | "forfeited" | "completed";

export type RoomParticipant = {
  id: ID;
  projectId: ID;
  roomId: ID;
  userId: ID;
  userName: string;
  userRole: RoleId;
  /** Selected ProjectRoleSpec.id */
  assignedRoleId?: ID;
  assignedRoleName?: string;
  isTemporaryCoordinator: boolean;
  status: RoomParticipantStatus;
  joinedAt: UnixMs;
  xpCommittedAmount: number;
  lastActivityAt?: UnixMs;
};

export type TaskStatus =
  | "assigned" | "in_progress" | "submitted" | "under_review"
  | "completed" | "rework_required" | "failed";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskSubmissionEvidence = {
  kind: "file_upload" | "github_link" | "behance_link" | "figma_link"
    | "google_drive_link" | "portfolio_link" | "screenshots"
    | "comments" | "text_submission";
  value: string;
  label?: string;
};

export type TaskSubmission = {
  id: ID;
  taskId: ID;
  submittedByUserId: ID;
  submittedByName: string;
  evidence: TaskSubmissionEvidence[];
  note?: string;
  submittedAt: UnixMs;
};

export type TaskReviewAction = "approve" | "reject" | "request_rework" | "mark_complete";

export type TaskReview = {
  id: ID;
  taskId: ID;
  reviewerUserId: ID;
  reviewerName: string;
  reviewerRole: RoleId;
  action: TaskReviewAction;
  note?: string;
  at: UnixMs;
};

export type ProjectTask = {
  id: ID;
  projectId: ID;
  roomId: ID;
  taskTitle: string;
  taskDescription: string;
  assignedToUserId: ID;
  assignedToName: string;
  deadline: UnixMs;
  priority: TaskPriority;
  deliverables?: string;
  dependencies?: ID[];
  attachments?: { name: string; url: string }[];
  status: TaskStatus;
  createdByUserId: ID;
  createdByName: string;
  createdByRole: RoleId;
  createdAt: UnixMs;
  updatedAt: UnixMs;
};

export type MembershipLogAction =
  | "joined" | "left" | "removed" | "role_assigned"
  | "coordinator_assigned" | "coordinator_transferred"
  | "xp_locked" | "xp_forfeited" | "completed";

export type MembershipLog = {
  id: ID;
  projectId: ID;
  userId: ID;
  byUserId?: ID;
  byName?: string;
  action: MembershipLogAction;
  note?: string;
  at: UnixMs;
};

/* ----------------------------- Storage -------------------------------- */

const KEYS = {
  projects: "scope_exec2_projects_v1",
  rooms: "scope_exec2_rooms_v1",
  participants: "scope_exec2_room_participants_v1",
  tasks: "scope_exec2_tasks_v1",
  submissions: "scope_exec2_task_submissions_v1",
  reviews: "scope_exec2_task_reviews_v1",
  logs: "scope_exec2_membership_logs_v1",
} as const;

const isBrowser = typeof window !== "undefined";

function read<T>(k: string): T[] {
  if (!isBrowser) return [];
  try { return JSON.parse(localStorage.getItem(k) || "[]") as T[]; } catch { return []; }
}
function write<T>(k: string, items: T[]) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(k, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: k } }));
  } catch { /* noop */ }
}
function uid(prefix: string): ID {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
}

/* --------------------------- Permissions ------------------------------ */

export function canCreateProject(role: RoleId): boolean {
  return canCreate("project", role);
}

const COORDINATOR_PERMITTED: Array<
  | "view_all_project_tasks" | "monitor_daily_reporting" | "create_sync_updates"
  | "coordinate_team_activity" | "view_project_progress" | "send_project_updates"
> = [
  "view_all_project_tasks", "monitor_daily_reporting", "create_sync_updates",
  "coordinate_team_activity", "view_project_progress", "send_project_updates",
];

const COORDINATOR_RESTRICTED: Array<
  | "cannot_remove_members" | "cannot_change_rewards" | "cannot_change_project_logic"
  | "cannot_edit_creator_configuration" | "cannot_change_xp_stake" | "cannot_change_deadline"
> = [
  "cannot_remove_members", "cannot_change_rewards", "cannot_change_project_logic",
  "cannot_edit_creator_configuration", "cannot_change_xp_stake", "cannot_change_deadline",
];

export const TEMPORARY_COORDINATOR_POLICY = {
  permitted: COORDINATOR_PERMITTED,
  restricted: COORDINATOR_RESTRICTED,
};

const COORDINATOR_TRANSFER_APPROVERS: RoleId[] = [
  "faculty_coordinator", "institutional_admin", "scope_admin", "super_admin", "scope_super_admin",
];

export function canApproveCoordinatorTransfer(role: RoleId): boolean {
  return COORDINATOR_TRANSFER_APPROVERS.includes(role);
}

const TASK_CREATOR_ROLES: RoleId[] = [
  "faculty_coordinator", "institutional_admin", "scope_admin", "super_admin", "scope_super_admin",
];

export function canCreateTask(role: RoleId, isTemporaryCoordinator: boolean): boolean {
  return isTemporaryCoordinator || TASK_CREATOR_ROLES.includes(role);
}

const TASK_REVIEWER_ROLES = TASK_CREATOR_ROLES;
export function canReviewTask(role: RoleId, isTemporaryCoordinator: boolean): boolean {
  return isTemporaryCoordinator || TASK_REVIEWER_ROLES.includes(role);
}

/* --------------------------- Eligibility ----------------------------- */

export type EligibilityCheckId =
  | "verified_student" | "minimum_xp_check" | "institution_eligibility"
  | "required_skill_match" | "max_concurrent_project_check" | "reliability_threshold_check";

export type EligibilityResult = {
  id: EligibilityCheckId;
  label: string;
  passed: boolean;
  note?: string;
};

export type EligibilityContext = {
  userId: ID;
  userRole: RoleId;
  userXp: number;
  userInstitution?: string;
  userSkills?: string[];
  userReliability: number;
};

export function evaluateEligibility(p: ExecutionProject, ctx: EligibilityContext): EligibilityResult[] {
  const concurrent = projectsExec.participants
    .byUser(ctx.userId)
    .filter((x) => x.status === "active").length;

  const checks: EligibilityResult[] = [
    {
      id: "verified_student",
      label: "Verified Scope Connect account",
      passed: !!ctx.userId,
    },
    {
      id: "minimum_xp_check",
      label: `Minimum ${p.minimumXpRequired} Reputation XP`,
      passed: ctx.userXp >= p.minimumXpRequired,
      note: ctx.userXp < p.minimumXpRequired ? `You have ${ctx.userXp} XP.` : undefined,
    },
    {
      id: "institution_eligibility",
      label: "Institution eligibility",
      passed:
        !p.allowedInstitutions?.length ||
        (ctx.userInstitution ? p.allowedInstitutions.includes(ctx.userInstitution) : false),
    },
    {
      id: "required_skill_match",
      label: "Skill match",
      passed:
        !p.requiredSkills?.length ||
        (ctx.userSkills?.some((s) => p.requiredSkills!.includes(s)) ?? false),
    },
    {
      id: "max_concurrent_project_check",
      label: `Under concurrent-project cap (${EXECUTION_CONSTANTS.MAX_CONCURRENT_PROJECTS})`,
      passed: concurrent < EXECUTION_CONSTANTS.MAX_CONCURRENT_PROJECTS,
      note: `Active: ${concurrent}`,
    },
    {
      id: "reliability_threshold_check",
      label: "Reliability Score ≥ 50",
      passed: ctx.userReliability >= 50,
      note: `Current: ${ctx.userReliability}`,
    },
  ];
  return checks;
}

export function isEligible(results: EligibilityResult[]): boolean {
  return results.every((r) => r.passed);
}

/* ------------------------------- Store -------------------------------- */

export const projectsExec = {
  /* ---------- Projects ---------- */
  projects: {
    all(): ExecutionProject[] { return read<ExecutionProject>(KEYS.projects); },
    list(): ExecutionProject[] {
      return projectsExec.projects.all().sort((a, b) => b.updatedAt - a.updatedAt);
    },
    listPublic(): ExecutionProject[] {
      return projectsExec.projects.list().filter((p) => p.status !== "draft");
    },
    get(id: ID) { return projectsExec.projects.all().find((p) => p.id === id); },
    create(input: Omit<ExecutionProject, "id" | "slug" | "status" | "createdAt" | "updatedAt"> & { status?: ProjectStatus }): ExecutionProject {
      const now = Date.now();
      const p: ExecutionProject = {
        ...input,
        id: uid("proj"),
        slug: slugify(input.projectTitle),
        status: input.status ?? "published",
        createdAt: now,
        updatedAt: now,
      };
      write(KEYS.projects, [p, ...projectsExec.projects.all()]);
      return p;
    },
    setStatus(id: ID, status: ProjectStatus) {
      const all = projectsExec.projects.all();
      const i = all.findIndex((p) => p.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], status, updatedAt: Date.now() };
      write(KEYS.projects, all);
    },
  },

  /* ---------- Rooms ---------- */
  rooms: {
    all(): ExecutionRoom[] { return read<ExecutionRoom>(KEYS.rooms); },
    byProject(projectId: ID) { return projectsExec.rooms.all().filter((r) => r.projectId === projectId); },
    get(id: ID) { return projectsExec.rooms.all().find((r) => r.id === id); },
    /** Get-or-create the first room for a project (auto-create on first join). */
    ensureForProject(p: ExecutionProject): ExecutionRoom {
      const existing = projectsExec.rooms.byProject(p.id);
      if (existing.length) return existing[0];
      const seq = existing.length + 1;
      const room: ExecutionRoom = {
        id: uid("room"),
        projectId: p.id,
        roomName: `${p.slug}-${p.id.slice(-4)}-${seq}`,
        status: "forming",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      write(KEYS.rooms, [room, ...projectsExec.rooms.all()]);
      return room;
    },
    setStatus(id: ID, status: RoomStatus) {
      const all = projectsExec.rooms.all();
      const i = all.findIndex((r) => r.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], status, updatedAt: Date.now() };
      write(KEYS.rooms, all);
    },
    setCoordinator(id: ID, userId: ID, userName: string) {
      const all = projectsExec.rooms.all();
      const i = all.findIndex((r) => r.id === id);
      if (i === -1) return;
      all[i] = {
        ...all[i],
        temporaryCoordinatorUserId: userId,
        temporaryCoordinatorName: userName,
        updatedAt: Date.now(),
      };
      write(KEYS.rooms, all);
    },
  },

  /* ---------- Participants ---------- */
  participants: {
    all(): RoomParticipant[] { return read<RoomParticipant>(KEYS.participants); },
    byProject(projectId: ID) { return projectsExec.participants.all().filter((p) => p.projectId === projectId); },
    byRoom(roomId: ID) { return projectsExec.participants.all().filter((p) => p.roomId === roomId); },
    byUser(userId: ID) { return projectsExec.participants.all().filter((p) => p.userId === userId); },
    forUserInProject(userId: ID, projectId: ID) {
      return projectsExec.participants.all().find((p) => p.userId === userId && p.projectId === projectId);
    },
    activeCountFor(projectId: ID) {
      return projectsExec.participants.byProject(projectId).filter((p) => p.status === "active").length;
    },
    add(input: Omit<RoomParticipant, "id" | "joinedAt" | "status" | "lastActivityAt"> & { status?: RoomParticipantStatus }): RoomParticipant {
      const now = Date.now();
      const p: RoomParticipant = {
        ...input,
        id: uid("rp"),
        joinedAt: now,
        status: input.status ?? "active",
        lastActivityAt: now,
      };
      write(KEYS.participants, [p, ...projectsExec.participants.all()]);
      return p;
    },
    setStatus(id: ID, status: RoomParticipantStatus) {
      const all = projectsExec.participants.all();
      const i = all.findIndex((p) => p.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], status };
      write(KEYS.participants, all);
    },
    assignCoordinator(id: ID, is: boolean) {
      const all = projectsExec.participants.all();
      const i = all.findIndex((p) => p.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], isTemporaryCoordinator: is };
      write(KEYS.participants, all);
    },
  },

  /* ---------- Tasks ---------- */
  tasks: {
    all(): ProjectTask[] { return read<ProjectTask>(KEYS.tasks); },
    byProject(projectId: ID) { return projectsExec.tasks.all().filter((t) => t.projectId === projectId); },
    byRoom(roomId: ID) { return projectsExec.tasks.all().filter((t) => t.roomId === roomId); },
    byAssignee(userId: ID) { return projectsExec.tasks.all().filter((t) => t.assignedToUserId === userId); },
    get(id: ID) { return projectsExec.tasks.all().find((t) => t.id === id); },
    create(input: Omit<ProjectTask, "id" | "createdAt" | "updatedAt" | "status"> & { status?: TaskStatus }): ProjectTask {
      const now = Date.now();
      const t: ProjectTask = {
        ...input,
        id: uid("task"),
        status: input.status ?? "assigned",
        createdAt: now,
        updatedAt: now,
      };
      write(KEYS.tasks, [t, ...projectsExec.tasks.all()]);
      return t;
    },
    setStatus(id: ID, status: TaskStatus) {
      const all = projectsExec.tasks.all();
      const i = all.findIndex((t) => t.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], status, updatedAt: Date.now() };
      write(KEYS.tasks, all);
    },
  },

  /* ---------- Submissions ---------- */
  submissions: {
    all(): TaskSubmission[] { return read<TaskSubmission>(KEYS.submissions); },
    byTask(taskId: ID) {
      return projectsExec.submissions.all()
        .filter((s) => s.taskId === taskId)
        .sort((a, b) => b.submittedAt - a.submittedAt);
    },
    create(input: Omit<TaskSubmission, "id" | "submittedAt">): TaskSubmission {
      const s: TaskSubmission = { ...input, id: uid("sub"), submittedAt: Date.now() };
      write(KEYS.submissions, [s, ...projectsExec.submissions.all()]);
      return s;
    },
  },

  /* ---------- Reviews ---------- */
  reviews: {
    all(): TaskReview[] { return read<TaskReview>(KEYS.reviews); },
    byTask(taskId: ID) {
      return projectsExec.reviews.all()
        .filter((r) => r.taskId === taskId)
        .sort((a, b) => b.at - a.at);
    },
    create(input: Omit<TaskReview, "id" | "at">): TaskReview {
      const r: TaskReview = { ...input, id: uid("rev"), at: Date.now() };
      write(KEYS.reviews, [r, ...projectsExec.reviews.all()]);
      return r;
    },
  },

  /* ---------- Membership log ---------- */
  logs: {
    all(): MembershipLog[] { return read<MembershipLog>(KEYS.logs); },
    byProject(projectId: ID) {
      return projectsExec.logs.all()
        .filter((l) => l.projectId === projectId)
        .sort((a, b) => b.at - a.at);
    },
    record(input: Omit<MembershipLog, "id" | "at">) {
      const l: MembershipLog = { ...input, id: uid("log"), at: Date.now() };
      write(KEYS.logs, [l, ...projectsExec.logs.all()]);
      return l;
    },
  },
};

/* ------------------------ High-level workflows ----------------------- */

export type JoinOutcome =
  | { ok: true; participant: RoomParticipant; room: ExecutionRoom; commitment: { amount: number } }
  | { ok: false; reason: string; failedChecks?: EligibilityResult[] };

export function joinProject(input: {
  project: ExecutionProject;
  user: { id: ID; name: string; role: RoleId };
  eligibility: EligibilityContext;
  assignedRoleId?: ID;
}): JoinOutcome {
  const { project, user, eligibility, assignedRoleId } = input;

  if (project.status === "draft" || project.status === "cancelled" || project.status === "expired") {
    return { ok: false, reason: "Project not open for participation." };
  }

  const existing = projectsExec.participants.forUserInProject(user.id, project.id);
  if (existing && existing.status === "active") {
    return { ok: false, reason: "You already joined this project." };
  }

  const activeCount = projectsExec.participants.activeCountFor(project.id);
  if (activeCount >= project.participantsNeeded) {
    return { ok: false, reason: "Room is locked — capacity reached." };
  }

  const checks = evaluateEligibility(project, eligibility);
  if (!isEligible(checks)) {
    return {
      ok: false,
      reason: "Eligibility checks not met.",
      failedChecks: checks.filter((c) => !c.passed),
    };
  }

  const room = projectsExec.rooms.ensureForProject(project);
  const firstParticipant = projectsExec.participants.byProject(project.id).length === 0;

  const roleSpec = project.roles.find((r) => r.id === assignedRoleId);
  const participant = projectsExec.participants.add({
    projectId: project.id,
    roomId: room.id,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    assignedRoleId: roleSpec?.id,
    assignedRoleName: roleSpec?.roleName,
    isTemporaryCoordinator: firstParticipant,
    xpCommittedAmount: project.xpCommitmentStake,
  });

  if (firstParticipant) {
    projectsExec.rooms.setCoordinator(room.id, user.id, user.name);
    projectsExec.logs.record({
      projectId: project.id, userId: user.id, byName: user.name,
      action: "coordinator_assigned",
      note: "Auto-assigned as first participant.",
    });
  }

  projectsExec.logs.record({
    projectId: project.id, userId: user.id, byName: user.name, action: "joined",
    note: roleSpec ? `Role: ${roleSpec.roleName}` : undefined,
  });
  projectsExec.logs.record({
    projectId: project.id, userId: user.id, byName: user.name, action: "xp_locked",
    note: `${project.xpCommitmentStake} XP committed.`,
  });

  // Update room/project status
  const newActiveCount = activeCount + 1;
  if (newActiveCount >= project.participantsNeeded) {
    projectsExec.rooms.setStatus(room.id, "locked");
    projectsExec.projects.setStatus(project.id, "active");
    projectsExec.logs.record({
      projectId: project.id, userId: user.id, action: "joined",
      note: "Room locked — capacity reached.",
    });
  } else if (newActiveCount > 0 && project.status === "published") {
    projectsExec.projects.setStatus(project.id, "room_forming");
    if (room.status === "forming") projectsExec.rooms.setStatus(room.id, "ready");
  }

  return {
    ok: true,
    participant,
    room,
    commitment: { amount: project.xpCommitmentStake },
  };
}

export function submitTask(input: {
  taskId: ID;
  submittedBy: { id: ID; name: string };
  evidence: TaskSubmissionEvidence[];
  note?: string;
}) {
  const t = projectsExec.tasks.get(input.taskId);
  if (!t) return { ok: false as const, reason: "Task not found." };
  if (t.assignedToUserId !== input.submittedBy.id) {
    return { ok: false as const, reason: "Only the assignee can submit this task." };
  }
  if (input.evidence.length === 0) {
    return { ok: false as const, reason: "Provide at least one piece of evidence." };
  }
  const sub = projectsExec.submissions.create({
    taskId: t.id,
    submittedByUserId: input.submittedBy.id,
    submittedByName: input.submittedBy.name,
    evidence: input.evidence,
    note: input.note,
  });
  projectsExec.tasks.setStatus(t.id, "submitted");
  return { ok: true as const, submission: sub };
}

export function reviewTask(input: {
  taskId: ID;
  reviewer: { id: ID; name: string; role: RoleId; isTemporaryCoordinator: boolean };
  action: TaskReviewAction;
  note?: string;
}) {
  const t = projectsExec.tasks.get(input.taskId);
  if (!t) return { ok: false as const, reason: "Task not found." };
  if (!canReviewTask(input.reviewer.role, input.reviewer.isTemporaryCoordinator)) {
    return { ok: false as const, reason: "Not permitted to review tasks." };
  }
  const r = projectsExec.reviews.create({
    taskId: t.id,
    reviewerUserId: input.reviewer.id,
    reviewerName: input.reviewer.name,
    reviewerRole: input.reviewer.role,
    action: input.action,
    note: input.note,
  });
  const nextStatus: TaskStatus =
    input.action === "approve" ? "under_review" :
    input.action === "mark_complete" ? "completed" :
    input.action === "request_rework" ? "rework_required" :
    "failed";
  projectsExec.tasks.setStatus(t.id, nextStatus);
  return { ok: true as const, review: r };
}

export function transferCoordinator(input: {
  projectId: ID;
  roomId: ID;
  fromUserId: ID;
  toParticipantId: ID;
  approver: { id: ID; name: string; role: RoleId };
}) {
  if (!canApproveCoordinatorTransfer(input.approver.role)) {
    return { ok: false as const, reason: "You cannot approve this transfer." };
  }
  const target = projectsExec.participants.all().find((p) => p.id === input.toParticipantId);
  if (!target || target.roomId !== input.roomId) {
    return { ok: false as const, reason: "Target participant not in this room." };
  }
  // Demote current
  const current = projectsExec.participants.byRoom(input.roomId).find((p) => p.isTemporaryCoordinator);
  if (current) projectsExec.participants.assignCoordinator(current.id, false);
  // Promote
  projectsExec.participants.assignCoordinator(target.id, true);
  projectsExec.rooms.setCoordinator(input.roomId, target.userId, target.userName);
  projectsExec.logs.record({
    projectId: input.projectId,
    userId: target.userId,
    byName: input.approver.name,
    action: "coordinator_transferred",
    note: `Approved by ${input.approver.role}`,
  });
  return { ok: true as const };
}

export const EXEC2_STORAGE_KEYS = KEYS;
