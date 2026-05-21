// Scope Connect — Execution Ecosystem (Part 1) engines.
// Pure additive logic helpers built on top of execution-store.ts.
// No UI, no routes, no RBAC mutations. Future parts will wire dashboards
// and workflows into these functions.

import type { RoleId } from "./rbac";
import {
  EXECUTION_CONSTANTS,
  RELIABILITY_NEGATIVE,
  RELIABILITY_POSITIVE,
  type EntityKind,
  type ReliabilityBehaviour,
  canCreate,
  canCreateTask,
} from "./execution-constants";
import {
  execution,
  type ID,
  type XpCommitmentKind,
} from "./execution-store";

/* ---------------------- XP Commitment Engine ------------------------- */

export const xpCommitmentEngine = {
  /** Lock XP at join/submission time. */
  lock(input: { userId: ID; kind: XpCommitmentKind; refId: ID; amount: number; reason?: string }) {
    const min = input.kind === "project"
      ? EXECUTION_CONSTANTS.MIN_PROJECT_XP
      : EXECUTION_CONSTANTS.MIN_CHALLENGE_XP;
    if (input.amount < min) {
      return { error: `Commitment must be at least ${min} Reputation XP.` };
    }
    return execution.commitments.lock(input);
  },

  /** Release a successful commitment (project completed / challenge evaluated). */
  release(commitmentId: ID, reason = "completed") {
    execution.commitments.resolve(commitmentId, "released", reason);
  },

  /** Full forfeiture per spec (no partial refund). */
  forfeit(commitmentId: ID, reason = "inactivity") {
    execution.commitments.resolve(commitmentId, "forfeited", reason);
  },
};

/* ------------------------ Forfeiture Engine -------------------------- */

export const forfeitureEngine = {
  /** Apply full forfeiture for inactivity on a project. */
  projectInactivity(input: { projectId: ID; userId: ID; commitmentId: ID; amount: number }) {
    if (!EXECUTION_CONSTANTS.FULL_FORFEITURE_ON_INACTIVITY) return;
    xpCommitmentEngine.forfeit(input.commitmentId, "inactivity");
    execution.forfeitures.record({
      projectId: input.projectId,
      userId: input.userId,
      xpCommitmentId: input.commitmentId,
      reason: "inactivity",
      amount: input.amount,
    });
    reliabilityEngine.log({
      userId: input.userId,
      behaviour: "project_dropout",
      sourceKind: "project",
      sourceId: input.projectId,
    });
  },

  /** Apply full forfeiture for non-submission of a challenge. */
  challengeNonSubmission(input: { challengeId: ID; userId: ID; commitmentId: ID }) {
    xpCommitmentEngine.forfeit(input.commitmentId, "challenge_non_submission");
    reliabilityEngine.log({
      userId: input.userId,
      behaviour: "challenge_non_submission",
      sourceKind: "challenge",
      sourceId: input.challengeId,
    });
  },
};

/* ---------------------- Warning Escalation Engine -------------------- */

export type EscalationLevel = "ok" | "warning" | "critical" | "forfeit";

export const warningEscalationEngine = {
  /** Days since last activity for a user in a project. */
  daysInactive(projectId: ID, userId: ID): number {
    const p = execution.participants.byProject(projectId).find((x) => x.userId === userId);
    if (!p?.lastActivityAt) return 0;
    return Math.floor((Date.now() - p.lastActivityAt) / (1000 * 60 * 60 * 24));
  },

  level(projectId: ID, userId: ID): EscalationLevel {
    const d = warningEscalationEngine.daysInactive(projectId, userId);
    if (d >= EXECUTION_CONSTANTS.COOLDOWN_AFTER_INACTIVITY_DAYS) return "forfeit";
    if (d >= EXECUTION_CONSTANTS.WARNING_ESCALATION_DAYS) return "critical";
    if (d >= Math.ceil(EXECUTION_CONSTANTS.WARNING_ESCALATION_DAYS / 2)) return "warning";
    return "ok";
  },
};

/* ------------------------ Reliability Engine ------------------------- */

const RELIABILITY_DELTAS: Record<ReliabilityBehaviour, number> = {
  // Positive
  daily_reporting: 1,
  task_completion: 3,
  peer_validation: 2,
  mentor_validation: 3,
  deadline_compliance: 2,
  consistent_contribution: 4,
  // Negative
  ghost_participation: -10,
  missed_reporting: -2,
  task_non_submission: -5,
  project_dropout: -15,
  challenge_non_submission: -8,
  peer_flags: -4,
  deadline_violation: -3,
};

export const reliabilityEngine = {
  log(input: { userId: ID; behaviour: ReliabilityBehaviour; sourceKind?: "project" | "challenge" | "task" | "report" | "system"; sourceId?: ID }) {
    const delta = RELIABILITY_DELTAS[input.behaviour] ?? 0;
    return execution.reliability.record({ ...input, delta });
  },
  score(userId: ID): number {
    return execution.reliability.scoreFor(userId);
  },
  tag(userId: ID): { label: string; tone: "positive" | "neutral" | "negative" } {
    const s = reliabilityEngine.score(userId);
    if (s >= 85) return { label: "Trusted Performer", tone: "positive" };
    if (s >= 70) return { label: "Reliable Collaborator", tone: "positive" };
    if (s >= 50) return { label: "Building Reliability", tone: "neutral" };
    if (s >= 25) return { label: "Low Reliability", tone: "negative" };
    return { label: "Ghost Participant", tone: "negative" };
  },
  isPositiveBehaviour(b: ReliabilityBehaviour): boolean {
    return (RELIABILITY_POSITIVE as readonly string[]).includes(b);
  },
  isNegativeBehaviour(b: ReliabilityBehaviour): boolean {
    return (RELIABILITY_NEGATIVE as readonly string[]).includes(b);
  },
};

/* --------------------- Contribution Scoring -------------------------- */

export type ContributionComponents = {
  reporting: number; tasks: number; peer: number; mentor: number; deadline: number;
};

export const contributionScoringEngine = {
  /** Compute a 0..100 weighted score from sub-components. */
  compute(components: ContributionComponents): number {
    const w = { reporting: 0.25, tasks: 0.3, peer: 0.15, mentor: 0.15, deadline: 0.15 };
    const total =
      components.reporting * w.reporting +
      components.tasks * w.tasks +
      components.peer * w.peer +
      components.mentor * w.mentor +
      components.deadline * w.deadline;
    return Math.max(0, Math.min(100, Math.round(total)));
  },

  upsert(input: { projectId: ID; userId: ID; components: ContributionComponents }) {
    const score = contributionScoringEngine.compute(input.components);
    return execution.contributions.upsert({
      projectId: input.projectId,
      userId: input.userId,
      score,
      components: input.components,
    });
  },

  meetsMinimum(score: number) {
    return execution.contributions.meetsMinimum(score);
  },
};

/* ------------------------ Leaderboard Engine ------------------------- */

export const leaderboardEngine = {
  /** Recompute ranks for a challenge based on existing submission scores. */
  recompute(challengeId: ID) {
    const subs = execution.submissions.byChallenge(challengeId)
      .filter((s) => typeof s.score === "number")
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    subs.forEach((s, idx) => {
      execution.leaderboards.upsert({
        challengeId,
        userId: s.userId,
        userName: s.userName,
        score: s.score ?? 0,
        rank: idx + 1,
        updatedAt: Date.now(),
      });
    });
    return execution.leaderboards.byChallenge(challengeId);
  },
};

/* ------------------ Opportunity Eligibility Engine ------------------- */

export const opportunityEligibilityEngine = {
  /** Default eligibility: reliability ≥ 70 AND at least one contribution ≥ min score. */
  evaluate(input: { opportunityId: ID; userId: ID }) {
    const reasons: string[] = [];
    const reliability = reliabilityEngine.score(input.userId);
    if (reliability < 70) reasons.push(`Reliability ${reliability} < 70`);

    const hasProof = execution.contributions.all()
      .some((c) => c.userId === input.userId
        && c.score >= EXECUTION_CONSTANTS.MIN_PROJECT_CONTRIBUTION_SCORE);
    if (!hasProof) reasons.push(`No project contribution ≥ ${EXECUTION_CONSTANTS.MIN_PROJECT_CONTRIBUTION_SCORE}`);

    const eligible = reasons.length === 0;
    return execution.eligibility.record({
      opportunityId: input.opportunityId,
      userId: input.userId,
      eligible,
      reasons,
    });
  },
};

/* -------------------------- Anti-Abuse Engine ------------------------ */

export const antiAbuseEngine = {
  /** Hard cap on concurrent active projects. */
  canJoinAnotherProject(userId: ID): { ok: true } | { ok: false; reason: string } {
    if (execution.participants.canJoinAnother(userId)) return { ok: true };
    return { ok: false, reason: `Limit of ${EXECUTION_CONSTANTS.MAX_CONCURRENT_PROJECTS} concurrent projects reached.` };
  },

  /** Basic ghost-participation heuristic — no reports + no task submissions in window. */
  detectGhost(projectId: ID, userId: ID, windowDays = EXECUTION_CONSTANTS.WARNING_ESCALATION_DAYS): boolean {
    const since = Date.now() - windowDays * 86400000;
    const reportedRecently = execution.reports.all()
      .some((r) => r.userId === userId && r.projectId === projectId && r.createdAt >= since);
    const submittedRecently = execution.tasks.byAssignee(userId)
      .some((t) => t.projectId === projectId && t.submission && t.submission.at >= since);
    return !reportedRecently && !submittedRecently;
  },
};

/* ---------------------- Creator-permission helper -------------------- */

export const creatorPermissions = {
  can(kind: EntityKind, role: RoleId, opts?: { isTemporaryCoordinator?: boolean }): boolean {
    if (kind === "task") return canCreateTask(role, opts?.isTemporaryCoordinator);
    return canCreate(kind, role);
  },
};
