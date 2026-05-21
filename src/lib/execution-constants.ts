// Scope Connect — Execution Ecosystem (Part 1) constants & vocabulary.
// Strict additive layer. No existing module imports from here yet; future
// parts (UI, dashboards, engines) will consume these as the canonical source.
//
// Storage strategy mirrors src/lib/governance-store.ts (frontend-only,
// localStorage + window event dispatch) so a MERN migration can swap the
// persistence layer without touching consumers.

import type { RoleId } from "./rbac";

/* ----------------------------- Vocabulary ----------------------------- */

export const EXECUTION_VOCAB = {
  xp_name: "Reputation XP",
  stake_name: "Commitment Stake",
  room_lead_name: "Temporary Coordinator",
  penalty_name: "Commitment Forfeiture",
  challenge_name: "Skill Validation Challenge",
  reliability_name: "Reliability Score",
} as const;

/* ------------------------------ Constants ----------------------------- */

export const EXECUTION_CONSTANTS = {
  DISCOVERABILITY_MIN_RECORDS: 5,
  MAX_CONCURRENT_PROJECTS: 3,
  DEFAULT_REPORTING_FREQUENCY: "daily" as const,
  MIN_PROJECT_CONTRIBUTION_SCORE: 70,
  MIN_CHALLENGE_SUBMISSION_REQUIRED: true,
  PROJECT_ROOM_LOCK_ENABLED: true,
  ALLOW_MULTI_ROLE_ASSIGNMENT: false,
  TEMPORARY_COORDINATOR_TRANSFER_ALLOWED: true,
  MIN_PROJECT_XP: 0,
  MIN_CHALLENGE_XP: 0,
  RELIABILITY_DEFAULT_SCORE: 100,
  COOLDOWN_AFTER_INACTIVITY_DAYS: 7,
  WARNING_ESCALATION_DAYS: 5,
  ALLOW_PARTIAL_PROJECT_REFUND: false,
  FULL_FORFEITURE_ON_INACTIVITY: true,
  MAX_ROOM_CAPACITY_OVERRIDE: false,
} as const;

/* ------------------------------- Engines ------------------------------ */

export const ENABLED_ENGINES = [
  "xp_commitment_engine",
  "project_room_engine",
  "task_engine",
  "daily_reporting_engine",
  "contribution_scoring_engine",
  "reward_distribution_engine",
  "challenge_scoring_engine",
  "leaderboard_engine",
  "reliability_engine",
  "opportunity_eligibility_engine",
  "anti_abuse_engine",
  "forfeiture_engine",
  "warning_escalation_engine",
] as const;

export type EngineName = (typeof ENABLED_ENGINES)[number];

/* --------------------------- Creator permissions --------------------- */

export type EntityKind = "project" | "challenge" | "opportunity" | "task";

const CREATOR_PERMS: Record<EntityKind, RoleId[]> = {
  project: ["institutional_admin", "faculty_coordinator", "scope_admin", "super_admin", "scope_super_admin"],
  challenge: ["institutional_admin", "faculty_coordinator", "scope_admin", "super_admin", "scope_super_admin"],
  opportunity: ["institutional_admin", "scope_admin", "super_admin", "scope_super_admin"],
  // temporary_coordinator is a runtime role; checked separately (see canCreateTask)
  task: ["institutional_admin", "faculty_coordinator", "scope_admin", "super_admin", "scope_super_admin"],
};

export function canCreate(kind: EntityKind, role: RoleId): boolean {
  return CREATOR_PERMS[kind].includes(role);
}

export function canCreateTask(role: RoleId, isTemporaryCoordinator = false): boolean {
  return canCreate("task", role) || isTemporaryCoordinator;
}

/* ----------------------- Role visibility matrix ----------------------- */

export const ROLE_VISIBILITY: Partial<Record<RoleId, {
  canJoinProjects?: boolean;
  canJoinChallenges?: boolean;
  canApplyOpportunities?: boolean;
  canCreateProjects?: boolean;
  canCreateChallenges?: boolean;
  canCreateOpportunities?: boolean;
  canCreateTasks?: boolean;
  canMonitorReporting?: boolean;
  fullAccess?: boolean;
}>> = {
  student: { canJoinProjects: true, canJoinChallenges: true, canApplyOpportunities: true, canCreateProjects: false },
  faculty_coordinator: { canCreateProjects: true, canCreateChallenges: true, canCreateTasks: true },
  institutional_admin: {
    canCreateProjects: true, canCreateChallenges: true, canCreateOpportunities: true,
    canCreateTasks: true, canMonitorReporting: true,
  },
  scope_admin: { fullAccess: true },
  scope_super_admin: { fullAccess: true },
  super_admin: { fullAccess: true },
};

/* --------------------------- Reliability tags ------------------------- */

export const RELIABILITY_TAGS = {
  positive: [
    "Reliable Collaborator",
    "Fast Executor",
    "High Consistency",
    "Strong Contributor",
    "Trusted Performer",
    "Team Player",
  ],
  negative: [
    "Inactive Contributor",
    "Missed Commitments",
    "Ghost Participant",
    "Low Reliability",
    "Missed Reporting",
    "Low Execution Consistency",
  ],
} as const;

export type ReliabilityTag =
  | (typeof RELIABILITY_TAGS.positive)[number]
  | (typeof RELIABILITY_TAGS.negative)[number];

/* ------------------------- Reliability behaviour ---------------------- */

export const RELIABILITY_POSITIVE = [
  "daily_reporting",
  "task_completion",
  "peer_validation",
  "mentor_validation",
  "deadline_compliance",
  "consistent_contribution",
] as const;

export const RELIABILITY_NEGATIVE = [
  "ghost_participation",
  "missed_reporting",
  "task_non_submission",
  "project_dropout",
  "challenge_non_submission",
  "peer_flags",
  "deadline_violation",
] as const;

export type ReliabilityBehaviour =
  | (typeof RELIABILITY_POSITIVE)[number]
  | (typeof RELIABILITY_NEGATIVE)[number];

/* ----------------------------- Workflows ------------------------------ */

export const PROJECT_FLOW = [
  "project_created", "project_published", "student_joined", "xp_locked",
  "room_created", "tasks_assigned", "daily_reporting", "contribution_scored",
  "project_reviewed", "xp_settlement", "reward_distribution", "opportunity_unlock",
] as const;

export const CHALLENGE_FLOW = [
  "challenge_created", "challenge_joined", "xp_locked", "challenge_submitted",
  "evaluation", "leaderboard_generation", "reward_distribution",
] as const;

export const OPPORTUNITY_FLOW = [
  "opportunity_created", "eligibility_check", "unlock",
  "application", "review", "selection",
] as const;

/* ----------------------------- Anti-abuse ----------------------------- */

export const ANTI_ABUSE_RULES = {
  enabled: true,
  max_concurrent_projects: EXECUTION_CONSTANTS.MAX_CONCURRENT_PROJECTS,
  project_spam_prevention: true,
  challenge_spam_prevention: true,
  xp_velocity_monitoring: true,
  ghost_participation_detection: true,
  repeated_role_farming_detection: true,
  reporting_abuse_detection: true,
} as const;
