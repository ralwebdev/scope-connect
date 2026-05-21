// Scope Connect — Execution Ecosystem (Part 1) data store.
// Strict additive: pure frontend persistence (localStorage), zero coupling
// to existing modules. Mirrors the pattern in src/lib/governance-store.ts
// so a future MERN backend can replace `read`/`write` without touching
// consumers. No UI, RBAC, routes, or workflows are modified by this file.
//
// Entities (per Part 1 spec):
//   project_rooms, project_participants, project_tasks, daily_reports,
//   challenge_submissions, leaderboards, xp_commitments, reward_transactions,
//   reliability_logs, contribution_scores, project_forfeitures,
//   opportunity_eligibility_logs

import type { RoleId } from "./rbac";
import {
  EXECUTION_CONSTANTS,
  RELIABILITY_POSITIVE,
  type ReliabilityBehaviour,
  type ReliabilityTag,
} from "./execution-constants";

/* ------------------------------- Types -------------------------------- */

export type ID = string;
export type UnixMs = number;

export type ProjectRoom = {
  id: ID;
  projectId: ID;
  name: string;
  capacity: number;
  locked: boolean;
  temporaryCoordinatorUserId?: ID;
  createdAt: UnixMs;
  updatedAt: UnixMs;
};

export type ProjectParticipant = {
  id: ID;
  projectId: ID;
  roomId?: ID;
  userId: ID;
  userName: string;
  role: RoleId;
  joinedAt: UnixMs;
  status: "active" | "inactive" | "forfeited" | "completed";
  lastActivityAt?: UnixMs;
};

export type ProjectTask = {
  id: ID;
  projectId: ID;
  roomId?: ID;
  title: string;
  description?: string;
  assigneeUserId?: ID;
  createdByUserId: ID;
  createdByRole: RoleId;
  dueAt?: UnixMs;
  status: "open" | "in_progress" | "submitted" | "approved" | "rejected";
  submission?: { at: UnixMs; note?: string; link?: string };
  reviewerNote?: string;
  createdAt: UnixMs;
  updatedAt: UnixMs;
};

export type DailyReport = {
  id: ID;
  projectId: ID;
  userId: ID;
  dayKey: string; // YYYY-MM-DD
  summary: string;
  hours?: number;
  blockers?: string;
  createdAt: UnixMs;
};

export type ChallengeSubmission = {
  id: ID;
  challengeId: ID;
  userId: ID;
  userName: string;
  submittedAt: UnixMs;
  payload?: Record<string, unknown>;
  score?: number;
  rank?: number;
  badge?: string;
};

export type LeaderboardEntry = {
  challengeId: ID;
  userId: ID;
  userName: string;
  score: number;
  rank: number;
  updatedAt: UnixMs;
};

export type XpCommitmentKind = "project" | "challenge";
export type XpCommitmentStatus = "locked" | "released" | "forfeited";

export type XpCommitment = {
  id: ID;
  userId: ID;
  kind: XpCommitmentKind;
  refId: ID; // projectId or challengeId
  amount: number; // Reputation XP locked
  status: XpCommitmentStatus;
  lockedAt: UnixMs;
  resolvedAt?: UnixMs;
  reason?: string;
};

export type RewardTransaction = {
  id: ID;
  userId: ID;
  amount: number;
  kind: "reward" | "refund" | "bonus";
  sourceKind: XpCommitmentKind;
  sourceId: ID;
  at: UnixMs;
  note?: string;
};

export type ReliabilityLog = {
  id: ID;
  userId: ID;
  behaviour: ReliabilityBehaviour;
  delta: number; // signed score change
  sourceKind?: "project" | "challenge" | "task" | "report" | "system";
  sourceId?: ID;
  at: UnixMs;
  tagSnapshot?: ReliabilityTag;
};

export type ContributionScore = {
  id: ID;
  projectId: ID;
  userId: ID;
  score: number; // 0..100
  components: {
    reporting: number;
    tasks: number;
    peer: number;
    mentor: number;
    deadline: number;
  };
  updatedAt: UnixMs;
};

export type ProjectForfeiture = {
  id: ID;
  projectId: ID;
  userId: ID;
  xpCommitmentId: ID;
  reason: "inactivity" | "dropout" | "non_submission" | "abuse";
  at: UnixMs;
  amount: number;
};

export type OpportunityEligibilityLog = {
  id: ID;
  opportunityId: ID;
  userId: ID;
  eligible: boolean;
  reasons: string[];
  at: UnixMs;
};

/* ----------------------------- Storage -------------------------------- */

const KEYS = {
  rooms: "scope_exec_project_rooms_v1",
  participants: "scope_exec_project_participants_v1",
  tasks: "scope_exec_project_tasks_v1",
  reports: "scope_exec_daily_reports_v1",
  submissions: "scope_exec_challenge_submissions_v1",
  leaderboards: "scope_exec_leaderboards_v1",
  commitments: "scope_exec_xp_commitments_v1",
  rewards: "scope_exec_reward_transactions_v1",
  reliability: "scope_exec_reliability_logs_v1",
  contributions: "scope_exec_contribution_scores_v1",
  forfeitures: "scope_exec_project_forfeitures_v1",
  eligibility: "scope_exec_opportunity_eligibility_logs_v1",
} as const;

const isBrowser = typeof window !== "undefined";

function read<T>(key: string): T[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key } }));
  } catch {
    /* noop */
  }
}

function uid(prefix: string): ID {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function dayKey(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10);
}

/* ------------------------------- Store -------------------------------- */

export const execution = {
  /* ---------- Rooms ---------- */
  rooms: {
    all(): ProjectRoom[] { return read<ProjectRoom>(KEYS.rooms); },
    byProject(projectId: ID): ProjectRoom[] {
      return execution.rooms.all().filter((r) => r.projectId === projectId);
    },
    create(input: Omit<ProjectRoom, "id" | "createdAt" | "updatedAt" | "locked"> & { locked?: boolean }): ProjectRoom {
      const now = Date.now();
      const room: ProjectRoom = {
        ...input,
        locked: input.locked ?? EXECUTION_CONSTANTS.PROJECT_ROOM_LOCK_ENABLED,
        id: uid("room"),
        createdAt: now,
        updatedAt: now,
      };
      write(KEYS.rooms, [room, ...execution.rooms.all()]);
      return room;
    },
    transferCoordinator(roomId: ID, newCoordinatorUserId: ID): boolean {
      if (!EXECUTION_CONSTANTS.TEMPORARY_COORDINATOR_TRANSFER_ALLOWED) return false;
      const all = execution.rooms.all();
      const i = all.findIndex((r) => r.id === roomId);
      if (i === -1) return false;
      all[i] = { ...all[i], temporaryCoordinatorUserId: newCoordinatorUserId, updatedAt: Date.now() };
      write(KEYS.rooms, all);
      return true;
    },
  },

  /* ---------- Participants ---------- */
  participants: {
    all(): ProjectParticipant[] { return read<ProjectParticipant>(KEYS.participants); },
    byProject(projectId: ID) { return execution.participants.all().filter((p) => p.projectId === projectId); },
    byUser(userId: ID) { return execution.participants.all().filter((p) => p.userId === userId); },
    activeConcurrentCount(userId: ID): number {
      return execution.participants.byUser(userId).filter((p) => p.status === "active").length;
    },
    canJoinAnother(userId: ID): boolean {
      return execution.participants.activeConcurrentCount(userId)
        < EXECUTION_CONSTANTS.MAX_CONCURRENT_PROJECTS;
    },
    add(input: Omit<ProjectParticipant, "id" | "joinedAt" | "status" | "lastActivityAt"> & { status?: ProjectParticipant["status"] }): ProjectParticipant | { error: string } {
      if (!execution.participants.canJoinAnother(input.userId)) {
        return { error: `Maximum ${EXECUTION_CONSTANTS.MAX_CONCURRENT_PROJECTS} concurrent projects reached.` };
      }
      const now = Date.now();
      const p: ProjectParticipant = { ...input, id: uid("part"), joinedAt: now, status: input.status ?? "active", lastActivityAt: now };
      write(KEYS.participants, [p, ...execution.participants.all()]);
      return p;
    },
    touch(userId: ID, projectId: ID) {
      const all = execution.participants.all();
      const i = all.findIndex((p) => p.userId === userId && p.projectId === projectId);
      if (i === -1) return;
      all[i] = { ...all[i], lastActivityAt: Date.now() };
      write(KEYS.participants, all);
    },
    setStatus(id: ID, status: ProjectParticipant["status"]) {
      const all = execution.participants.all();
      const i = all.findIndex((p) => p.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], status };
      write(KEYS.participants, all);
    },
  },

  /* ---------- Tasks ---------- */
  tasks: {
    all(): ProjectTask[] { return read<ProjectTask>(KEYS.tasks); },
    byProject(projectId: ID) { return execution.tasks.all().filter((t) => t.projectId === projectId); },
    byAssignee(userId: ID) { return execution.tasks.all().filter((t) => t.assigneeUserId === userId); },
    create(input: Omit<ProjectTask, "id" | "createdAt" | "updatedAt" | "status"> & { status?: ProjectTask["status"] }): ProjectTask {
      const now = Date.now();
      const t: ProjectTask = { ...input, id: uid("task"), status: input.status ?? "open", createdAt: now, updatedAt: now };
      write(KEYS.tasks, [t, ...execution.tasks.all()]);
      return t;
    },
    submit(id: ID, submission: NonNullable<ProjectTask["submission"]>) {
      const all = execution.tasks.all();
      const i = all.findIndex((t) => t.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], submission, status: "submitted", updatedAt: Date.now() };
      write(KEYS.tasks, all);
    },
    review(id: ID, decision: "approved" | "rejected", note?: string) {
      const all = execution.tasks.all();
      const i = all.findIndex((t) => t.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], status: decision, reviewerNote: note, updatedAt: Date.now() };
      write(KEYS.tasks, all);
    },
  },

  /* ---------- Daily reports ---------- */
  reports: {
    all(): DailyReport[] { return read<DailyReport>(KEYS.reports); },
    byProject(projectId: ID) { return execution.reports.all().filter((r) => r.projectId === projectId); },
    byUser(userId: ID) { return execution.reports.all().filter((r) => r.userId === userId); },
    today(userId: ID, projectId: ID): DailyReport | undefined {
      const k = dayKey();
      return execution.reports.all().find((r) => r.userId === userId && r.projectId === projectId && r.dayKey === k);
    },
    submit(input: Omit<DailyReport, "id" | "createdAt" | "dayKey"> & { dayKey?: string }): DailyReport {
      const now = Date.now();
      const r: DailyReport = { ...input, id: uid("rep"), dayKey: input.dayKey ?? dayKey(now), createdAt: now };
      write(KEYS.reports, [r, ...execution.reports.all()]);
      execution.participants.touch(input.userId, input.projectId);
      return r;
    },
  },

  /* ---------- Challenge submissions / leaderboards ---------- */
  submissions: {
    all(): ChallengeSubmission[] { return read<ChallengeSubmission>(KEYS.submissions); },
    byChallenge(id: ID) { return execution.submissions.all().filter((s) => s.challengeId === id); },
    byUser(userId: ID) { return execution.submissions.all().filter((s) => s.userId === userId); },
    submit(input: Omit<ChallengeSubmission, "id" | "submittedAt">): ChallengeSubmission {
      const s: ChallengeSubmission = { ...input, id: uid("sub"), submittedAt: Date.now() };
      write(KEYS.submissions, [s, ...execution.submissions.all()]);
      return s;
    },
  },

  leaderboards: {
    all(): LeaderboardEntry[] { return read<LeaderboardEntry>(KEYS.leaderboards); },
    byChallenge(id: ID) {
      return execution.leaderboards.all()
        .filter((e) => e.challengeId === id)
        .sort((a, b) => a.rank - b.rank);
    },
    upsert(entry: LeaderboardEntry) {
      const all = execution.leaderboards.all();
      const i = all.findIndex((e) => e.challengeId === entry.challengeId && e.userId === entry.userId);
      if (i === -1) all.unshift(entry);
      else all[i] = { ...entry, updatedAt: Date.now() };
      write(KEYS.leaderboards, all);
    },
  },

  /* ---------- XP commitments ---------- */
  commitments: {
    all(): XpCommitment[] { return read<XpCommitment>(KEYS.commitments); },
    byUser(userId: ID) { return execution.commitments.all().filter((c) => c.userId === userId); },
    forRef(kind: XpCommitmentKind, refId: ID) {
      return execution.commitments.all().filter((c) => c.kind === kind && c.refId === refId);
    },
    lock(input: { userId: ID; kind: XpCommitmentKind; refId: ID; amount: number; reason?: string }): XpCommitment {
      const c: XpCommitment = { ...input, id: uid("xpc"), status: "locked", lockedAt: Date.now() };
      write(KEYS.commitments, [c, ...execution.commitments.all()]);
      return c;
    },
    resolve(id: ID, status: Exclude<XpCommitmentStatus, "locked">, reason?: string) {
      const all = execution.commitments.all();
      const i = all.findIndex((c) => c.id === id);
      if (i === -1) return;
      all[i] = { ...all[i], status, resolvedAt: Date.now(), reason: reason ?? all[i].reason };
      write(KEYS.commitments, all);
    },
  },

  /* ---------- Rewards ---------- */
  rewards: {
    all(): RewardTransaction[] { return read<RewardTransaction>(KEYS.rewards); },
    byUser(userId: ID) { return execution.rewards.all().filter((r) => r.userId === userId); },
    record(input: Omit<RewardTransaction, "id" | "at">): RewardTransaction {
      const r: RewardTransaction = { ...input, id: uid("rwd"), at: Date.now() };
      write(KEYS.rewards, [r, ...execution.rewards.all()]);
      return r;
    },
  },

  /* ---------- Reliability ---------- */
  reliability: {
    logs(): ReliabilityLog[] { return read<ReliabilityLog>(KEYS.reliability); },
    byUser(userId: ID) { return execution.reliability.logs().filter((l) => l.userId === userId); },
    /** Aggregate score = default + sum(delta), clamped to [0, 100]. */
    scoreFor(userId: ID): number {
      const sum = execution.reliability.byUser(userId).reduce((s, l) => s + l.delta, 0);
      return Math.max(0, Math.min(100, EXECUTION_CONSTANTS.RELIABILITY_DEFAULT_SCORE + sum));
    },
    record(input: Omit<ReliabilityLog, "id" | "at">): ReliabilityLog {
      const l: ReliabilityLog = { ...input, id: uid("rel"), at: Date.now() };
      write(KEYS.reliability, [l, ...execution.reliability.logs()]);
      return l;
    },
    isPositive(b: ReliabilityBehaviour): boolean {
      return (RELIABILITY_POSITIVE as readonly string[]).includes(b);
    },
  },

  /* ---------- Contribution scores ---------- */
  contributions: {
    all(): ContributionScore[] { return read<ContributionScore>(KEYS.contributions); },
    forProject(projectId: ID) { return execution.contributions.all().filter((c) => c.projectId === projectId); },
    forUser(projectId: ID, userId: ID) {
      return execution.contributions.all().find((c) => c.projectId === projectId && c.userId === userId);
    },
    upsert(input: Omit<ContributionScore, "id" | "updatedAt"> & { id?: ID }): ContributionScore {
      const all = execution.contributions.all();
      const existing = all.find((c) => c.projectId === input.projectId && c.userId === input.userId);
      const next: ContributionScore = {
        ...input,
        id: existing?.id ?? input.id ?? uid("cs"),
        updatedAt: Date.now(),
      };
      const filtered = all.filter((c) => c.id !== next.id);
      write(KEYS.contributions, [next, ...filtered]);
      return next;
    },
    meetsMinimum(score: number): boolean {
      return score >= EXECUTION_CONSTANTS.MIN_PROJECT_CONTRIBUTION_SCORE;
    },
  },

  /* ---------- Forfeitures ---------- */
  forfeitures: {
    all(): ProjectForfeiture[] { return read<ProjectForfeiture>(KEYS.forfeitures); },
    byProject(projectId: ID) { return execution.forfeitures.all().filter((f) => f.projectId === projectId); },
    record(input: Omit<ProjectForfeiture, "id" | "at">): ProjectForfeiture {
      const f: ProjectForfeiture = { ...input, id: uid("frf"), at: Date.now() };
      write(KEYS.forfeitures, [f, ...execution.forfeitures.all()]);
      return f;
    },
  },

  /* ---------- Opportunity eligibility ---------- */
  eligibility: {
    all(): OpportunityEligibilityLog[] { return read<OpportunityEligibilityLog>(KEYS.eligibility); },
    forOpportunity(id: ID) { return execution.eligibility.all().filter((l) => l.opportunityId === id); },
    record(input: Omit<OpportunityEligibilityLog, "id" | "at">): OpportunityEligibilityLog {
      const l: OpportunityEligibilityLog = { ...input, id: uid("elg"), at: Date.now() };
      write(KEYS.eligibility, [l, ...execution.eligibility.all()]);
      return l;
    },
  },

  /* ---------- Dev utility ---------- */
  _resetAll() {
    if (!isBrowser) return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: "*" } }));
  },
};

export const EXECUTION_STORAGE_KEYS = KEYS;
