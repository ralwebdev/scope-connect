// Scope Connect — Execution Ecosystem (Part 5)
// Opportunity + Eligibility + Recruiter Trust + Cooldown + Anti-Abuse Engine.
// Strict additive: localStorage-backed, no existing modules import from here.
// Wired only through /opportunities-hub routes.

import type { RoleId } from "./rbac";

/* ------------------------------ Types --------------------------------- */

export type ID = string;
export type UnixMs = number;

export type OpportunityType =
  | "internship" | "placement" | "campus_leadership" | "research"
  | "startup_role" | "scope_magazine" | "chapter_operations" | "competition"
  | "freelance" | "mentorship" | "scholarship" | "ambassador_program"
  | "project_based" | "faculty_assistantship" | "industry_collaboration"
  | "hackathon" | "innovation_lab" | "custom";

export type OpportunityStatus =
  | "draft" | "published" | "open" | "applications_open"
  | "under_review" | "shortlisted" | "closed" | "expired" | "archived";

export type OpportunityMode = "remote" | "hybrid" | "onsite";

export type SelectionMethod =
  | "direct_selection" | "application_review" | "faculty_review"
  | "score_based_auto_selection" | "hybrid";

export type Opportunity = {
  id: ID;
  slug: string;
  status: OpportunityStatus;
  // Step 1
  opportunityTitle: string;
  opportunityType: OpportunityType;
  organizationName?: string;
  description: string;
  duration?: string;
  mode?: OpportunityMode;
  location?: string;
  // Step 2 — eligibility
  minimumReliabilityScore: number;
  minimumXpRequired: number;
  minimumProjectCompletionCount: number;
  minimumContributionScore: number;
  requiredSkills?: string[];
  allowedInstitutions?: string[];
  allowedDepartments?: string[];
  // Step 3 — selection
  selectionMethod: SelectionMethod;
  maxCandidates?: number;
  requireStatementOfInterest: boolean;
  requirePortfolioLinks: boolean;
  // Premium tier
  isPremium: boolean;
  // Meta
  createdByUserId: ID;
  createdByName: string;
  createdByRole: RoleId;
  createdAt: UnixMs;
  updatedAt: UnixMs;
  applicationsDeadline?: UnixMs;
};

export type ApplicationStatus =
  | "submitted" | "under_review" | "shortlisted" | "selected" | "rejected" | "expired";

export type OpportunityApplication = {
  id: ID;
  opportunityId: ID;
  userId: ID;
  userName: string;
  userRole: RoleId;
  institution?: string;
  status: ApplicationStatus;
  statementOfInterest: string;
  portfolioLinks: string[];
  supportingDocuments: string[];
  meritSnapshot: number;
  submittedAt: UnixMs;
  updatedAt: UnixMs;
};

export type EligibilityCheckId =
  | "verified_account" | "minimum_reliability" | "minimum_xp"
  | "minimum_projects" | "minimum_contribution" | "required_skills"
  | "institution_match" | "department_match" | "cooldown_clear"
  | "premium_threshold";

export type EligibilityResult = {
  id: EligibilityCheckId;
  label: string;
  passed: boolean;
  note?: string;
};

export type EligibilityLog = {
  id: ID;
  userId: ID;
  opportunityId: ID;
  results: EligibilityResult[];
  meritScore: number;
  at: UnixMs;
};

export type CooldownReason =
  | "project_forfeiture" | "challenge_non_submission"
  | "ghost_participation" | "repeated_missed_reporting";

export type CooldownSeverity = "default" | "repeat" | "high";

export type CooldownLog = {
  id: ID;
  userId: ID;
  reason: CooldownReason;
  severity: CooldownSeverity;
  startedAt: UnixMs;
  expiresAt: UnixMs;
  active: boolean;
  note?: string;
};

export type TrustTagPositive =
  | "Highly Reliable" | "Consistent Performer" | "Execution Focused"
  | "Top Collaborator" | "Deadline Compliant" | "High Ownership";

export type TrustTagNegative =
  | "Inactive Contributor" | "Missed Deadlines" | "Project Dropout"
  | "Low Reliability" | "Challenge Non-Submission";

export type RecruiterTrustProfile = {
  userId: ID;
  userName: string;
  reliabilityScore: number;
  completedProjects: number;
  averageContributionScore: number;
  challengeRanking?: number;
  skillBadges: string[];
  xpLevel: number;
  leadershipRoles: string[];
  disciplinaryFlags: string[];
  positiveTags: TrustTagPositive[];
  negativeTags: TrustTagNegative[];
  recruiterReady: boolean;
  updatedAt: UnixMs;
};

export type AbuseRiskLevel = "low" | "medium" | "high" | "critical";

export type AbuseDetectionLog = {
  id: ID;
  userId: ID;
  ruleId: string;
  riskLevel: AbuseRiskLevel;
  actions: string[];
  details?: string;
  at: UnixMs;
};

export type MeritScore = {
  userId: ID;
  reliability: number;
  projects: number;
  contribution: number;
  xpLevel: number;
  challenge: number;
  peer: number;
  total: number;
  updatedAt: UnixMs;
};

export type StudentRanking = {
  userId: ID;
  userName: string;
  rank: number;
  category: "reliability" | "project_completion" | "challenge" | "contribution";
  score: number;
  updatedAt: UnixMs;
};

/* ----------------------------- Storage -------------------------------- */

const KEYS = {
  opportunities: "scope_p5_opportunities_v1",
  applications: "scope_p5_applications_v1",
  eligibility: "scope_p5_eligibility_logs_v1",
  cooldowns: "scope_p5_cooldown_logs_v1",
  trustProfiles: "scope_p5_trust_profiles_v1",
  abuseLogs: "scope_p5_abuse_logs_v1",
  meritScores: "scope_p5_merit_scores_v1",
  rankings: "scope_p5_rankings_v1",
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
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "opportunity";
}

/* --------------------------- Permissions ------------------------------ */

const OPPORTUNITY_CREATORS: RoleId[] = [
  "institutional_admin", "scope_admin", "super_admin", "scope_super_admin",
];

export function canCreateOpportunity(role: RoleId): boolean {
  return OPPORTUNITY_CREATORS.includes(role);
}

export function canReviewApplications(role: RoleId, opportunity: Opportunity, userId: ID): boolean {
  if (OPPORTUNITY_CREATORS.includes(role) || role === "faculty_coordinator") return true;
  return opportunity.createdByUserId === userId;
}

/* ----------------------- Eligibility weights ------------------------- */

export const ELIGIBILITY_WEIGHTS = {
  reliability_score: 30,
  project_completion_count: 20,
  average_contribution_score: 20,
  xp_level: 10,
  challenge_performance: 10,
  peer_reputation: 10,
} as const;

export const PREMIUM_THRESHOLD = {
  minimumReliability: 80,
  minimumProjectsCompleted: 3,
  minimumAverageContribution: 75,
} as const;

export type EligibilityContext = {
  userId: ID;
  userRole: RoleId;
  userName?: string;
  userInstitution?: string;
  userDepartment?: string;
  userSkills?: string[];
  userXp: number;
  userXpLevel: number;
  userReliability: number;
  userProjectsCompleted: number;
  userAverageContribution: number;
  userChallengePerformance: number; // 0-100
  userPeerReputation: number;       // 0-100
};

export function computeMeritScore(ctx: EligibilityContext): number {
  const w = ELIGIBILITY_WEIGHTS;
  const norm = (v: number, max: number) => Math.max(0, Math.min(1, max ? v / max : 0));
  const score =
    norm(ctx.userReliability, 100) * w.reliability_score +
    norm(ctx.userProjectsCompleted, 10) * w.project_completion_count +
    norm(ctx.userAverageContribution, 100) * w.average_contribution_score +
    norm(ctx.userXpLevel, 20) * w.xp_level +
    norm(ctx.userChallengePerformance, 100) * w.challenge_performance +
    norm(ctx.userPeerReputation, 100) * w.peer_reputation;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function evaluateOpportunityEligibility(o: Opportunity, ctx: EligibilityContext): EligibilityResult[] {
  const r: EligibilityResult[] = [];
  r.push({
    id: "verified_account",
    label: "Verified account",
    passed: !!ctx.userId && ctx.userRole !== "viewer",
  });
  r.push({
    id: "minimum_reliability",
    label: `Reliability ≥ ${o.minimumReliabilityScore}`,
    passed: ctx.userReliability >= o.minimumReliabilityScore,
    note: `Your reliability: ${ctx.userReliability}`,
  });
  r.push({
    id: "minimum_xp",
    label: `Minimum ${o.minimumXpRequired} XP`,
    passed: ctx.userXp >= o.minimumXpRequired,
    note: `You have ${ctx.userXp} XP`,
  });
  r.push({
    id: "minimum_projects",
    label: `Completed projects ≥ ${o.minimumProjectCompletionCount}`,
    passed: ctx.userProjectsCompleted >= o.minimumProjectCompletionCount,
    note: `You completed ${ctx.userProjectsCompleted}`,
  });
  r.push({
    id: "minimum_contribution",
    label: `Contribution score ≥ ${o.minimumContributionScore}`,
    passed: ctx.userAverageContribution >= o.minimumContributionScore,
    note: `Your score: ${ctx.userAverageContribution}`,
  });
  r.push({
    id: "required_skills",
    label: "Required skills",
    passed: !o.requiredSkills?.length || (ctx.userSkills?.some(s => o.requiredSkills!.includes(s)) ?? false),
  });
  r.push({
    id: "institution_match",
    label: "Institution eligibility",
    passed: !o.allowedInstitutions?.length || (!!ctx.userInstitution && o.allowedInstitutions.includes(ctx.userInstitution)),
  });
  r.push({
    id: "department_match",
    label: "Department eligibility",
    passed: !o.allowedDepartments?.length || (!!ctx.userDepartment && o.allowedDepartments.includes(ctx.userDepartment)),
  });
  r.push({
    id: "cooldown_clear",
    label: "No active cooldown",
    passed: !cooldown.isUserOnCooldown(ctx.userId),
    note: cooldown.isUserOnCooldown(ctx.userId) ? "Cooldown active" : undefined,
  });
  if (o.isPremium) {
    const t = PREMIUM_THRESHOLD;
    const passed =
      ctx.userReliability >= t.minimumReliability &&
      ctx.userProjectsCompleted >= t.minimumProjectsCompleted &&
      ctx.userAverageContribution >= t.minimumAverageContribution;
    r.push({
      id: "premium_threshold",
      label: "Premium opportunity threshold",
      passed,
      note: passed ? "Premium tier unlocked" : `Need ≥${t.minimumReliability} reliability, ${t.minimumProjectsCompleted} projects, ${t.minimumAverageContribution} avg contribution`,
    });
  }
  return r;
}

export function isEligible(results: EligibilityResult[]): boolean {
  return results.every(r => r.passed);
}

/* ------------------------------ Stores -------------------------------- */

export const opportunities = {
  all(): Opportunity[] { return read<Opportunity>(KEYS.opportunities); },
  listPublic(): Opportunity[] {
    return read<Opportunity>(KEYS.opportunities)
      .filter(o => ["published", "open", "applications_open", "under_review", "shortlisted"].includes(o.status))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  byId(id: ID): Opportunity | undefined {
    return read<Opportunity>(KEYS.opportunities).find(o => o.id === id);
  },
  create(input: Omit<Opportunity, "id" | "slug" | "status" | "createdAt" | "updatedAt"> & { status?: OpportunityStatus }): Opportunity {
    const now = Date.now();
    const o: Opportunity = {
      ...input,
      id: uid("opp"),
      slug: slugify(input.opportunityTitle),
      status: input.status ?? "applications_open",
      createdAt: now,
      updatedAt: now,
    };
    const list = read<Opportunity>(KEYS.opportunities);
    list.unshift(o);
    write(KEYS.opportunities, list);
    return o;
  },
  setStatus(id: ID, status: OpportunityStatus) {
    const list = read<Opportunity>(KEYS.opportunities);
    const idx = list.findIndex(o => o.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], status, updatedAt: Date.now() };
    write(KEYS.opportunities, list);
  },
};

export const applications = {
  all(): OpportunityApplication[] { return read<OpportunityApplication>(KEYS.applications); },
  byOpportunity(opportunityId: ID): OpportunityApplication[] {
    return read<OpportunityApplication>(KEYS.applications)
      .filter(a => a.opportunityId === opportunityId)
      .sort((a, b) => b.meritSnapshot - a.meritSnapshot);
  },
  byUser(userId: ID): OpportunityApplication[] {
    return read<OpportunityApplication>(KEYS.applications).filter(a => a.userId === userId);
  },
  hasApplied(userId: ID, opportunityId: ID): boolean {
    return read<OpportunityApplication>(KEYS.applications)
      .some(a => a.userId === userId && a.opportunityId === opportunityId);
  },
  submit(input: Omit<OpportunityApplication, "id" | "status" | "submittedAt" | "updatedAt">): OpportunityApplication {
    const now = Date.now();
    const a: OpportunityApplication = {
      ...input,
      id: uid("app"),
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    };
    const list = read<OpportunityApplication>(KEYS.applications);
    list.unshift(a);
    write(KEYS.applications, list);
    return a;
  },
  setStatus(id: ID, status: ApplicationStatus) {
    const list = read<OpportunityApplication>(KEYS.applications);
    const idx = list.findIndex(a => a.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], status, updatedAt: Date.now() };
    write(KEYS.applications, list);
  },
};

export const eligibilityLogs = {
  all(): EligibilityLog[] { return read<EligibilityLog>(KEYS.eligibility); },
  record(userId: ID, opportunityId: ID, results: EligibilityResult[], meritScore: number) {
    const list = read<EligibilityLog>(KEYS.eligibility);
    list.unshift({ id: uid("elg"), userId, opportunityId, results, meritScore, at: Date.now() });
    write(KEYS.eligibility, list.slice(0, 500));
  },
};

const COOLDOWN_DAYS = { default: 7, repeat: 14, high: 30 } as const;
const DAY_MS = 86_400_000;

export const cooldown = {
  all(): CooldownLog[] { return read<CooldownLog>(KEYS.cooldowns); },
  byUser(userId: ID): CooldownLog[] {
    return read<CooldownLog>(KEYS.cooldowns).filter(c => c.userId === userId);
  },
  activeFor(userId: ID): CooldownLog | undefined {
    const now = Date.now();
    return read<CooldownLog>(KEYS.cooldowns).find(c => c.userId === userId && c.active && c.expiresAt > now);
  },
  isUserOnCooldown(userId: ID): boolean { return !!cooldown.activeFor(userId); },
  start(userId: ID, reason: CooldownReason, severity: CooldownSeverity = "default", note?: string): CooldownLog {
    const days = COOLDOWN_DAYS[severity];
    const startedAt = Date.now();
    const log: CooldownLog = {
      id: uid("cd"),
      userId, reason, severity,
      startedAt,
      expiresAt: startedAt + days * DAY_MS,
      active: true,
      note,
    };
    const list = read<CooldownLog>(KEYS.cooldowns);
    list.unshift(log);
    write(KEYS.cooldowns, list);
    return log;
  },
  clear(id: ID) {
    const list = read<CooldownLog>(KEYS.cooldowns);
    const idx = list.findIndex(c => c.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], active: false };
    write(KEYS.cooldowns, list);
  },
};

export const trustProfiles = {
  all(): RecruiterTrustProfile[] { return read<RecruiterTrustProfile>(KEYS.trustProfiles); },
  byUser(userId: ID): RecruiterTrustProfile | undefined {
    return read<RecruiterTrustProfile>(KEYS.trustProfiles).find(p => p.userId === userId);
  },
  upsert(profile: Omit<RecruiterTrustProfile, "updatedAt">) {
    const list = read<RecruiterTrustProfile>(KEYS.trustProfiles);
    const idx = list.findIndex(p => p.userId === profile.userId);
    const next: RecruiterTrustProfile = { ...profile, updatedAt: Date.now() };
    if (idx < 0) list.unshift(next); else list[idx] = next;
    write(KEYS.trustProfiles, list);
    return next;
  },
};

export function deriveTrustTags(ctx: EligibilityContext): { positive: TrustTagPositive[]; negative: TrustTagNegative[] } {
  const positive: TrustTagPositive[] = [];
  const negative: TrustTagNegative[] = [];
  if (ctx.userReliability >= 90) positive.push("Highly Reliable");
  if (ctx.userReliability >= 80 && ctx.userProjectsCompleted >= 3) positive.push("Consistent Performer");
  if (ctx.userAverageContribution >= 80) positive.push("Execution Focused");
  if (ctx.userPeerReputation >= 80) positive.push("Top Collaborator");
  if (ctx.userReliability >= 75 && ctx.userAverageContribution >= 70) positive.push("Deadline Compliant");
  if (ctx.userProjectsCompleted >= 5 && ctx.userAverageContribution >= 75) positive.push("High Ownership");
  if (ctx.userReliability < 50) negative.push("Low Reliability");
  if (ctx.userAverageContribution < 40) negative.push("Inactive Contributor");
  if (cooldown.isUserOnCooldown(ctx.userId)) negative.push("Project Dropout");
  return { positive, negative };
}

/* --------------------------- Anti-Abuse ------------------------------- */

const ABUSE_LIMITS = {
  maxConcurrentProjects: 3,
} as const;

export type AbuseSignal = {
  ruleId: string;
  riskLevel: AbuseRiskLevel;
  details?: string;
};

export const abuseLogs = {
  all(): AbuseDetectionLog[] { return read<AbuseDetectionLog>(KEYS.abuseLogs); },
  byUser(userId: ID): AbuseDetectionLog[] {
    return read<AbuseDetectionLog>(KEYS.abuseLogs).filter(a => a.userId === userId);
  },
  record(userId: ID, signal: AbuseSignal): AbuseDetectionLog {
    const actions = ACTIONS_FOR_RISK[signal.riskLevel];
    const log: AbuseDetectionLog = {
      id: uid("ab"),
      userId,
      ruleId: signal.ruleId,
      riskLevel: signal.riskLevel,
      actions: [...actions],
      details: signal.details,
      at: Date.now(),
    };
    const list = read<AbuseDetectionLog>(KEYS.abuseLogs);
    list.unshift(log);
    write(KEYS.abuseLogs, list.slice(0, 500));
    // Auto-escalation: high/critical triggers cooldown
    if (signal.riskLevel === "high") {
      cooldown.start(userId, "ghost_participation", "default", `Auto: ${signal.ruleId}`);
    } else if (signal.riskLevel === "critical") {
      cooldown.start(userId, "ghost_participation", "high", `Auto: ${signal.ruleId}`);
    }
    return log;
  },
};

const ACTIONS_FOR_RISK: Record<AbuseRiskLevel, string[]> = {
  low: ["warning"],
  medium: ["temporary_restriction", "manual_review"],
  high: ["cooldown", "opportunity_block"],
  critical: ["account_flag", "manual_admin_review"],
};

export function detectAbuseSignals(input: {
  userId: ID;
  concurrentProjects?: number;
  recentSubmissionHashes?: string[];
  recentChallengeJoins?: number;
  recentProjectAbandonments?: number;
  recentFakeReports?: number;
  peerReviewClusters?: number;
  xpFarmingFlag?: boolean;
  inactiveRoomJoins?: number;
  reputationManipulationFlag?: boolean;
}): AbuseSignal[] {
  const signals: AbuseSignal[] = [];
  if ((input.concurrentProjects ?? 0) > ABUSE_LIMITS.maxConcurrentProjects) {
    signals.push({ ruleId: "max_concurrent_projects", riskLevel: "medium",
      details: `Concurrent: ${input.concurrentProjects}` });
  }
  const hashes = input.recentSubmissionHashes ?? [];
  const dupes = hashes.length - new Set(hashes).size;
  if (dupes > 0) {
    signals.push({ ruleId: "duplicate_submission_detection", riskLevel: "high",
      details: `${dupes} duplicate submissions` });
  }
  if ((input.recentChallengeJoins ?? 0) > 10) {
    signals.push({ ruleId: "challenge_spam_detection", riskLevel: "medium" });
  }
  if ((input.recentProjectAbandonments ?? 0) >= 2) {
    signals.push({ ruleId: "project_hopping_detection", riskLevel: "high" });
  }
  if ((input.recentFakeReports ?? 0) > 0) {
    signals.push({ ruleId: "fake_reporting_detection", riskLevel: "high" });
  }
  if ((input.peerReviewClusters ?? 0) > 0) {
    signals.push({ ruleId: "peer_review_manipulation_detection", riskLevel: "critical" });
  }
  if (input.xpFarmingFlag) {
    signals.push({ ruleId: "xp_farming_detection", riskLevel: "high" });
  }
  if ((input.inactiveRoomJoins ?? 0) > 5) {
    signals.push({ ruleId: "inactive_room_join_detection", riskLevel: "medium" });
  }
  if (input.reputationManipulationFlag) {
    signals.push({ ruleId: "reputation_manipulation_detection", riskLevel: "critical" });
  }
  return signals;
}

/* --------------------------- Merit / Ranking -------------------------- */

export const meritScores = {
  all(): MeritScore[] { return read<MeritScore>(KEYS.meritScores); },
  byUser(userId: ID): MeritScore | undefined {
    return read<MeritScore>(KEYS.meritScores).find(s => s.userId === userId);
  },
  upsertFromContext(ctx: EligibilityContext): MeritScore {
    const w = ELIGIBILITY_WEIGHTS;
    const norm = (v: number, max: number) => Math.max(0, Math.min(1, max ? v / max : 0));
    const next: MeritScore = {
      userId: ctx.userId,
      reliability: Math.round(norm(ctx.userReliability, 100) * w.reliability_score),
      projects: Math.round(norm(ctx.userProjectsCompleted, 10) * w.project_completion_count),
      contribution: Math.round(norm(ctx.userAverageContribution, 100) * w.average_contribution_score),
      xpLevel: Math.round(norm(ctx.userXpLevel, 20) * w.xp_level),
      challenge: Math.round(norm(ctx.userChallengePerformance, 100) * w.challenge_performance),
      peer: Math.round(norm(ctx.userPeerReputation, 100) * w.peer_reputation),
      total: computeMeritScore(ctx),
      updatedAt: Date.now(),
    };
    const list = read<MeritScore>(KEYS.meritScores);
    const idx = list.findIndex(s => s.userId === ctx.userId);
    if (idx < 0) list.unshift(next); else list[idx] = next;
    write(KEYS.meritScores, list);
    return next;
  },
};

export const rankings = {
  all(): StudentRanking[] { return read<StudentRanking>(KEYS.rankings); },
  byCategory(category: StudentRanking["category"]): StudentRanking[] {
    return read<StudentRanking>(KEYS.rankings)
      .filter(r => r.category === category)
      .sort((a, b) => a.rank - b.rank);
  },
};

/* ---------------- High-level workflow: applyForOpportunity ------------ */

export type ApplyResult =
  | { ok: true; application: OpportunityApplication }
  | { ok: false; reason: "not_eligible" | "already_applied" | "not_open" | "missing_statement"; details?: EligibilityResult[] };

export function applyForOpportunity(input: {
  opportunityId: ID;
  ctx: EligibilityContext;
  statementOfInterest: string;
  portfolioLinks?: string[];
  supportingDocuments?: string[];
}): ApplyResult {
  const o = opportunities.byId(input.opportunityId);
  if (!o) return { ok: false, reason: "not_open" };
  if (!["published", "open", "applications_open"].includes(o.status)) {
    return { ok: false, reason: "not_open" };
  }
  if (applications.hasApplied(input.ctx.userId, o.id)) {
    return { ok: false, reason: "already_applied" };
  }
  const results = evaluateOpportunityEligibility(o, input.ctx);
  const merit = computeMeritScore(input.ctx);
  eligibilityLogs.record(input.ctx.userId, o.id, results, merit);
  if (!isEligible(results)) return { ok: false, reason: "not_eligible", details: results };
  if (o.requireStatementOfInterest && (!input.statementOfInterest || input.statementOfInterest.trim().length < 20)) {
    return { ok: false, reason: "missing_statement" };
  }
  meritScores.upsertFromContext(input.ctx);
  const application = applications.submit({
    opportunityId: o.id,
    userId: input.ctx.userId,
    userName: input.ctx.userName ?? "Anonymous",
    userRole: input.ctx.userRole,
    institution: input.ctx.userInstitution,
    statementOfInterest: input.statementOfInterest.trim(),
    portfolioLinks: input.portfolioLinks ?? [],
    supportingDocuments: input.supportingDocuments ?? [],
    meritSnapshot: merit,
  });
  return { ok: true, application };
}

/* --------------------------- Public surface --------------------------- */

export const opportunityEngine = {
  opportunities,
  applications,
  eligibilityLogs,
  cooldown,
  trustProfiles,
  abuseLogs,
  meritScores,
  rankings,
  applyForOpportunity,
  evaluateOpportunityEligibility,
  computeMeritScore,
  detectAbuseSignals,
  deriveTrustTags,
  canCreateOpportunity,
  canReviewApplications,
  ELIGIBILITY_WEIGHTS,
  PREMIUM_THRESHOLD,
};
