// Scope Connect — Execution Ecosystem (Part 4): Challenge + Reward + Leaderboard.
// Strict additive: localStorage-backed, mirrors projects-execution-store conventions.
// No existing modules import from here — wired only through /challenges-arena routes.

import type { RoleId } from "./rbac";
import { EXECUTION_CONSTANTS } from "./execution-constants";

/* ------------------------------- Types -------------------------------- */

export type ID = string;
export type UnixMs = number;

export type ChallengeStatus =
  | "draft" | "published" | "open" | "submission_open"
  | "evaluation_in_progress" | "leaderboard_published"
  | "completed" | "archived";

export type ChallengeType =
  | "design" | "ui_ux" | "content_writing" | "software_development"
  | "web_development" | "mobile_development" | "marketing" | "business_strategy"
  | "research" | "video_editing" | "graphic_design" | "animation"
  | "photography" | "innovation" | "startup" | "cross_domain" | "custom";

export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type ChallengeVisibility = "public" | "institution_only" | "invite_only";
export type EvaluationMethod = "manual_review" | "rubric_based_scoring" | "mentor_review" | "jury_review" | "hybrid";

export type SubmissionFormat =
  | "pdf" | "ppt" | "docx" | "zip" | "github_repository" | "figma_link"
  | "behance_link" | "portfolio_link" | "google_drive_link" | "youtube_link" | "text_submission";

export type Challenge = {
  id: ID;
  slug: string;
  status: ChallengeStatus;
  // Step 1
  challengeTitle: string;
  challengeType: ChallengeType;
  challengeDescription: string;
  difficultyLevel?: ChallengeDifficulty;
  challengeDurationDays: number;
  challengeDeadline: UnixMs;
  // Step 2
  minimumXpRequired: number;
  minimumReliabilityScore: number;
  allowedInstitutions?: string[];
  requiredSkills?: string[];
  challengeVisibility: ChallengeVisibility;
  // Step 3
  commitmentStakeXp: number;
  rewardPoolXp: number;
  certificateEnabled: boolean;
  badgeEnabled: boolean;
  // Step 4
  evaluationMethod: EvaluationMethod;
  submissionFormats: SubmissionFormat[];
  // Meta
  createdByUserId: ID;
  createdByName: string;
  createdByRole: RoleId;
  createdAt: UnixMs;
  updatedAt: UnixMs;
};

export type ParticipantStatus = "joined" | "submitted" | "evaluated" | "forfeited" | "withdrawn";

export type ChallengeParticipant = {
  id: ID;
  challengeId: ID;
  userId: ID;
  userName: string;
  userRole: RoleId;
  institution?: string;
  status: ParticipantStatus;
  xpCommittedAmount: number;
  joinedAt: UnixMs;
};

export type SubmissionLink = { label?: string; url: string };

export type ChallengeSubmission = {
  id: ID;
  challengeId: ID;
  participantId: ID;
  userId: ID;
  userName: string;
  submissionTitle: string;
  submissionDescription: string;
  files?: { name: string; url: string }[];
  links?: SubmissionLink[];
  submittedAt: UnixMs;
  onTime: boolean;
};

export type EvaluationScores = {
  executionQuality: number; // 0..30
  innovation: number; // 0..20
  technicalAccuracy: number; // 0..20
  presentation: number; // 0..15
  deadlineAdherence: number; // 0..15
};

export type ChallengeEvaluation = {
  id: ID;
  challengeId: ID;
  submissionId: ID;
  reviewerUserId: ID;
  reviewerName: string;
  reviewerRole: RoleId;
  scores: EvaluationScores;
  totalScore: number; // 0..100
  feedback?: string;
  at: UnixMs;
};

export type LeaderboardEntry = {
  rank: number;
  participantId: ID;
  userId: ID;
  userName: string;
  institution?: string;
  score: number;
  submittedAt?: UnixMs;
  badge?: BadgeName;
  status: "qualified" | "forfeited" | "pending";
};

export type ChallengeLeaderboard = {
  challengeId: ID;
  generatedAt: UnixMs;
  entries: LeaderboardEntry[];
};

export type BadgeName =
  | "Gold Performer" | "Silver Performer" | "Bronze Performer"
  | "Challenge Finisher" | "Top Innovator" | "Creative Excellence" | "Fast Executor";

export type ChallengeReward = {
  id: ID;
  challengeId: ID;
  participantId: ID;
  userId: ID;
  userName: string;
  rank: number;
  multiplier: number;
  xpAwarded: number;
  badge?: BadgeName;
  distributedAt: UnixMs;
};

export type ChallengeCertificate = {
  id: ID;
  challengeId: ID;
  participantId: ID;
  userId: ID;
  userName: string;
  certificateType: "participation" | "winner" | "top_performer";
  issuedAt: UnixMs;
};

export type ForfeitureLog = {
  id: ID;
  challengeId: ID;
  participantId: ID;
  userId: ID;
  reason: "challenge_non_submission" | "deadline_expired_without_submission";
  xpForfeited: number;
  reliabilityDelta: number;
  negativeTags: string[];
  at: UnixMs;
};

/* ----------------------------- Storage -------------------------------- */

const KEYS = {
  challenges: "scope_ch4_challenges_v1",
  participants: "scope_ch4_participants_v1",
  submissions: "scope_ch4_submissions_v1",
  evaluations: "scope_ch4_evaluations_v1",
  leaderboards: "scope_ch4_leaderboards_v1",
  rewards: "scope_ch4_rewards_v1",
  certificates: "scope_ch4_certificates_v1",
  forfeitures: "scope_ch4_forfeitures_v1",
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
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "challenge";
}

/* --------------------------- Permissions ------------------------------ */

const CHALLENGE_CREATORS: RoleId[] = [
  "faculty_coordinator", "institutional_admin", "scope_admin", "super_admin", "scope_super_admin",
];
const CHALLENGE_REVIEWERS: RoleId[] = [
  "faculty_coordinator", "institutional_admin", "scope_admin", "super_admin", "scope_super_admin",
];

export function canCreateChallenge(role: RoleId): boolean {
  return CHALLENGE_CREATORS.includes(role);
}
export function canReviewChallenge(role: RoleId): boolean {
  return CHALLENGE_REVIEWERS.includes(role);
}

/* --------------------------- Eligibility ----------------------------- */

export type EligibilityCheckId =
  | "verified_student" | "minimum_xp_check" | "minimum_reliability_check"
  | "required_skill_check" | "institution_eligibility";

export type EligibilityResult = { id: EligibilityCheckId; label: string; passed: boolean; note?: string };

export type EligibilityContext = {
  userId: ID;
  userRole: RoleId;
  userXp: number;
  userReliability: number;
  userInstitution?: string;
  userSkills?: string[];
};

export function evaluateChallengeEligibility(c: Challenge, ctx: EligibilityContext): EligibilityResult[] {
  const r: EligibilityResult[] = [];
  r.push({
    id: "verified_student",
    label: "Verified account",
    passed: !!ctx.userId && ctx.userRole !== "viewer",
  });
  r.push({
    id: "minimum_xp_check",
    label: `Minimum ${c.minimumXpRequired} XP`,
    passed: ctx.userXp >= c.minimumXpRequired,
    note: `You have ${ctx.userXp} XP`,
  });
  r.push({
    id: "minimum_reliability_check",
    label: `Reliability ≥ ${c.minimumReliabilityScore}`,
    passed: ctx.userReliability >= c.minimumReliabilityScore,
    note: `Your reliability: ${ctx.userReliability}`,
  });
  r.push({
    id: "required_skill_check",
    label: "Required skills",
    passed: !c.requiredSkills?.length || (ctx.userSkills?.some(s => c.requiredSkills!.includes(s)) ?? false),
  });
  r.push({
    id: "institution_eligibility",
    label: "Institution eligibility",
    passed: !c.allowedInstitutions?.length || (!!ctx.userInstitution && c.allowedInstitutions.includes(ctx.userInstitution)),
  });
  return r;
}

export function isEligible(results: EligibilityResult[]): boolean {
  return results.every(r => r.passed);
}

/* ---------------------------- Scoring -------------------------------- */

export function computeTotalScore(s: EvaluationScores): number {
  const total = s.executionQuality + s.innovation + s.technicalAccuracy + s.presentation + s.deadlineAdherence;
  return Math.max(0, Math.min(100, Math.round(total)));
}

/* --------------------------- Reward bands ---------------------------- */

export function rewardBandFor(rank: number, totalRanked: number): { multiplier: number; badge: BadgeName } {
  if (totalRanked <= 0) return { multiplier: 1.0, badge: "Challenge Finisher" };
  if (rank === 1) return { multiplier: 2.0, badge: "Gold Performer" };
  if (rank >= 2 && rank <= 5) return { multiplier: 1.5, badge: "Silver Performer" };
  if (rank >= 6 && rank <= 10) return { multiplier: 1.2, badge: "Bronze Performer" };
  return { multiplier: 1.0, badge: "Challenge Finisher" };
}

/* ------------------------------ Store --------------------------------- */

export const challengeArena = {
  challenges: {
    all(): Challenge[] { return read<Challenge>(KEYS.challenges); },
    listPublic(): Challenge[] {
      return read<Challenge>(KEYS.challenges)
        .filter(c => ["published", "open", "submission_open", "evaluation_in_progress", "leaderboard_published", "completed"].includes(c.status))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    byId(id: ID): Challenge | undefined { return read<Challenge>(KEYS.challenges).find(c => c.id === id); },
    create(input: Omit<Challenge, "id" | "slug" | "status" | "createdAt" | "updatedAt"> & { status?: ChallengeStatus }): Challenge {
      const now = Date.now();
      const challenge: Challenge = {
        ...input,
        id: uid("ch"),
        slug: slugify(input.challengeTitle),
        status: input.status ?? "open",
        createdAt: now,
        updatedAt: now,
      };
      const list = read<Challenge>(KEYS.challenges);
      list.unshift(challenge);
      write(KEYS.challenges, list);
      return challenge;
    },
    setStatus(id: ID, status: ChallengeStatus): Challenge | undefined {
      const list = read<Challenge>(KEYS.challenges);
      const idx = list.findIndex(c => c.id === id);
      if (idx < 0) return undefined;
      list[idx] = { ...list[idx], status, updatedAt: Date.now() };
      write(KEYS.challenges, list);
      return list[idx];
    },
  },

  participants: {
    all(): ChallengeParticipant[] { return read<ChallengeParticipant>(KEYS.participants); },
    forChallenge(challengeId: ID): ChallengeParticipant[] {
      return read<ChallengeParticipant>(KEYS.participants).filter(p => p.challengeId === challengeId);
    },
    byUserAndChallenge(userId: ID, challengeId: ID): ChallengeParticipant | undefined {
      return read<ChallengeParticipant>(KEYS.participants)
        .find(p => p.userId === userId && p.challengeId === challengeId);
    },
    add(p: Omit<ChallengeParticipant, "id" | "joinedAt" | "status"> & { status?: ParticipantStatus }): ChallengeParticipant {
      const item: ChallengeParticipant = {
        ...p,
        id: uid("cp"),
        status: p.status ?? "joined",
        joinedAt: Date.now(),
      };
      const list = read<ChallengeParticipant>(KEYS.participants);
      list.push(item);
      write(KEYS.participants, list);
      return item;
    },
    setStatus(id: ID, status: ParticipantStatus) {
      const list = read<ChallengeParticipant>(KEYS.participants);
      const idx = list.findIndex(p => p.id === id);
      if (idx < 0) return;
      list[idx] = { ...list[idx], status };
      write(KEYS.participants, list);
    },
  },

  submissions: {
    all(): ChallengeSubmission[] { return read<ChallengeSubmission>(KEYS.submissions); },
    forChallenge(challengeId: ID): ChallengeSubmission[] {
      return read<ChallengeSubmission>(KEYS.submissions).filter(s => s.challengeId === challengeId);
    },
    forParticipant(participantId: ID): ChallengeSubmission | undefined {
      return read<ChallengeSubmission>(KEYS.submissions).find(s => s.participantId === participantId);
    },
    create(s: Omit<ChallengeSubmission, "id" | "submittedAt">): ChallengeSubmission {
      const item: ChallengeSubmission = { ...s, id: uid("cs"), submittedAt: Date.now() };
      const list = read<ChallengeSubmission>(KEYS.submissions);
      list.push(item);
      write(KEYS.submissions, list);
      return item;
    },
  },

  evaluations: {
    all(): ChallengeEvaluation[] { return read<ChallengeEvaluation>(KEYS.evaluations); },
    forChallenge(challengeId: ID): ChallengeEvaluation[] {
      return read<ChallengeEvaluation>(KEYS.evaluations).filter(e => e.challengeId === challengeId);
    },
    forSubmission(submissionId: ID): ChallengeEvaluation[] {
      return read<ChallengeEvaluation>(KEYS.evaluations).filter(e => e.submissionId === submissionId);
    },
    create(e: Omit<ChallengeEvaluation, "id" | "at" | "totalScore"> & { totalScore?: number }): ChallengeEvaluation {
      const item: ChallengeEvaluation = {
        ...e,
        id: uid("ev"),
        totalScore: e.totalScore ?? computeTotalScore(e.scores),
        at: Date.now(),
      };
      const list = read<ChallengeEvaluation>(KEYS.evaluations);
      list.push(item);
      write(KEYS.evaluations, list);
      return item;
    },
  },

  leaderboards: {
    forChallenge(challengeId: ID): ChallengeLeaderboard | undefined {
      return read<ChallengeLeaderboard>(KEYS.leaderboards).find(l => l.challengeId === challengeId);
    },
    save(l: ChallengeLeaderboard) {
      const list = read<ChallengeLeaderboard>(KEYS.leaderboards).filter(x => x.challengeId !== l.challengeId);
      list.push(l);
      write(KEYS.leaderboards, list);
    },
  },

  rewards: {
    forChallenge(challengeId: ID): ChallengeReward[] {
      return read<ChallengeReward>(KEYS.rewards).filter(r => r.challengeId === challengeId);
    },
    saveBatch(items: ChallengeReward[]) {
      const list = read<ChallengeReward>(KEYS.rewards).filter(r => !items.find(x => x.challengeId === r.challengeId));
      write(KEYS.rewards, [...list, ...items]);
    },
  },

  certificates: {
    forChallenge(challengeId: ID): ChallengeCertificate[] {
      return read<ChallengeCertificate>(KEYS.certificates).filter(c => c.challengeId === challengeId);
    },
    saveBatch(items: ChallengeCertificate[]) {
      const list = read<ChallengeCertificate>(KEYS.certificates).filter(c => !items.find(x => x.challengeId === c.challengeId));
      write(KEYS.certificates, [...list, ...items]);
    },
  },

  forfeitures: {
    forChallenge(challengeId: ID): ForfeitureLog[] {
      return read<ForfeitureLog>(KEYS.forfeitures).filter(f => f.challengeId === challengeId);
    },
    record(f: Omit<ForfeitureLog, "id" | "at">): ForfeitureLog {
      const item: ForfeitureLog = { ...f, id: uid("ff"), at: Date.now() };
      const list = read<ForfeitureLog>(KEYS.forfeitures);
      list.push(item);
      write(KEYS.forfeitures, list);
      return item;
    },
  },
};

/* ---------------------- Workflow: join challenge --------------------- */

export type JoinChallengeOutcome =
  | { ok: true; participant: ChallengeParticipant }
  | { ok: false; reason: string; failedChecks?: EligibilityResult[] };

export function joinChallenge(challengeId: ID, ctx: EligibilityContext): JoinChallengeOutcome {
  const challenge = challengeArena.challenges.byId(challengeId);
  if (!challenge) return { ok: false, reason: "Challenge not found" };
  if (Date.now() > challenge.challengeDeadline) return { ok: false, reason: "Deadline has passed" };
  if (challengeArena.participants.byUserAndChallenge(ctx.userId, challengeId)) {
    return { ok: false, reason: "Already joined this challenge" };
  }
  const checks = evaluateChallengeEligibility(challenge, ctx);
  if (!isEligible(checks)) {
    return { ok: false, reason: "Eligibility checks failed", failedChecks: checks.filter(x => !x.passed) };
  }
  if (ctx.userXp < challenge.commitmentStakeXp) {
    return { ok: false, reason: `Insufficient XP to commit stake (${challenge.commitmentStakeXp})` };
  }
  const participant = challengeArena.participants.add({
    challengeId,
    userId: ctx.userId,
    userName: ctx.userId, // caller can pass display name via wrapper if needed
    userRole: ctx.userRole,
    institution: ctx.userInstitution,
    xpCommittedAmount: challenge.commitmentStakeXp,
  });
  return { ok: true, participant };
}

/* -------------------- Workflow: submit a challenge -------------------- */

export type SubmitChallengeInput = {
  challengeId: ID;
  userId: ID;
  userName: string;
  submissionTitle: string;
  submissionDescription: string;
  files?: { name: string; url: string }[];
  links?: SubmissionLink[];
};

export type SubmitChallengeOutcome =
  | { ok: true; submission: ChallengeSubmission }
  | { ok: false; reason: string };

export function submitChallenge(input: SubmitChallengeInput): SubmitChallengeOutcome {
  const challenge = challengeArena.challenges.byId(input.challengeId);
  if (!challenge) return { ok: false, reason: "Challenge not found" };
  const participant = challengeArena.participants.byUserAndChallenge(input.userId, input.challengeId);
  if (!participant) return { ok: false, reason: "You haven't joined this challenge" };
  if (challengeArena.submissions.forParticipant(participant.id)) {
    return { ok: false, reason: "Multiple submissions are not allowed" };
  }
  const now = Date.now();
  if (now > challenge.challengeDeadline) {
    return { ok: false, reason: "Deadline has passed — late submissions are not allowed" };
  }
  const submission = challengeArena.submissions.create({
    challengeId: input.challengeId,
    participantId: participant.id,
    userId: input.userId,
    userName: input.userName,
    submissionTitle: input.submissionTitle,
    submissionDescription: input.submissionDescription,
    files: input.files,
    links: input.links,
    onTime: now <= challenge.challengeDeadline,
  });
  challengeArena.participants.setStatus(participant.id, "submitted");
  return { ok: true, submission };
}

/* ---------------- Workflow: generate leaderboard + rewards ----------- */

export type FinalizeOutcome = {
  leaderboard: ChallengeLeaderboard;
  rewards: ChallengeReward[];
  certificates: ChallengeCertificate[];
  forfeitures: ForfeitureLog[];
};

export function finalizeChallenge(challengeId: ID): FinalizeOutcome | undefined {
  const challenge = challengeArena.challenges.byId(challengeId);
  if (!challenge) return undefined;

  const participants = challengeArena.participants.forChallenge(challengeId);
  const submissions = challengeArena.submissions.forChallenge(challengeId);
  const evaluations = challengeArena.evaluations.forChallenge(challengeId);

  // Score per participant: avg of evaluations across that participant's submission
  const scoresByParticipant = new Map<ID, number>();
  const subByParticipant = new Map<ID, ChallengeSubmission>();
  submissions.forEach(s => subByParticipant.set(s.participantId, s));

  participants.forEach(p => {
    const sub = subByParticipant.get(p.id);
    if (!sub) return;
    const evs = evaluations.filter(e => e.submissionId === sub.id);
    if (!evs.length) return;
    const avg = evs.reduce((a, b) => a + b.totalScore, 0) / evs.length;
    scoresByParticipant.set(p.id, Math.round(avg));
  });

  const qualified = participants
    .filter(p => scoresByParticipant.has(p.id))
    .map(p => ({
      participant: p,
      submission: subByParticipant.get(p.id)!,
      score: scoresByParticipant.get(p.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // tie-break: earlier submission wins (deadline_completion)
      return (a.submission.submittedAt) - (b.submission.submittedAt);
    });

  const entries: LeaderboardEntry[] = qualified.map((q, i) => {
    const rank = i + 1;
    const band = rewardBandFor(rank, qualified.length);
    return {
      rank,
      participantId: q.participant.id,
      userId: q.participant.userId,
      userName: q.participant.userName,
      institution: q.participant.institution,
      score: q.score,
      submittedAt: q.submission.submittedAt,
      badge: band.badge,
      status: "qualified",
    };
  });

  // Append forfeited (non-submitters)
  participants
    .filter(p => !subByParticipant.has(p.id))
    .forEach(p => {
      entries.push({
        rank: 0,
        participantId: p.id,
        userId: p.userId,
        userName: p.userName,
        institution: p.institution,
        score: 0,
        status: "forfeited",
      });
    });

  const leaderboard: ChallengeLeaderboard = {
    challengeId,
    generatedAt: Date.now(),
    entries,
  };
  challengeArena.leaderboards.save(leaderboard);

  // Rewards
  const rewards: ChallengeReward[] = qualified.map((q, i) => {
    const rank = i + 1;
    const band = rewardBandFor(rank, qualified.length);
    const base = Math.floor(challenge.rewardPoolXp / Math.max(1, qualified.length));
    const xpAwarded = Math.round(base * band.multiplier);
    return {
      id: uid("rw"),
      challengeId,
      participantId: q.participant.id,
      userId: q.participant.userId,
      userName: q.participant.userName,
      rank,
      multiplier: band.multiplier,
      xpAwarded,
      badge: challenge.badgeEnabled ? band.badge : undefined,
      distributedAt: Date.now(),
    };
  });
  challengeArena.rewards.saveBatch(rewards);

  // Certificates
  const certificates: ChallengeCertificate[] = [];
  if (challenge.certificateEnabled) {
    qualified.forEach((q, i) => {
      const rank = i + 1;
      const type: ChallengeCertificate["certificateType"] =
        rank === 1 ? "winner" : rank <= 5 ? "top_performer" : "participation";
      certificates.push({
        id: uid("cert"),
        challengeId,
        participantId: q.participant.id,
        userId: q.participant.userId,
        userName: q.participant.userName,
        certificateType: type,
        issuedAt: Date.now(),
      });
    });
    challengeArena.certificates.saveBatch(certificates);
  }

  // Forfeitures for non-submitters
  const forfeitures: ForfeitureLog[] = [];
  participants
    .filter(p => !subByParticipant.has(p.id) && p.status !== "forfeited")
    .forEach(p => {
      challengeArena.participants.setStatus(p.id, "forfeited");
      forfeitures.push(
        challengeArena.forfeitures.record({
          challengeId,
          participantId: p.id,
          userId: p.userId,
          reason: "challenge_non_submission",
          xpForfeited: p.xpCommittedAmount,
          reliabilityDelta: -15,
          negativeTags: ["Missed Challenge Submission", "Low Challenge Reliability"],
        }),
      );
    });

  // Move challenge state
  challengeArena.challenges.setStatus(challengeId, "leaderboard_published");

  return { leaderboard, rewards, certificates, forfeitures };
}

/* ---------------------- Reliability extensions ----------------------- */

export const CHALLENGE_RELIABILITY = {
  positive: {
    challenge_submission: +3,
    high_score: +5, // score >= 80
    top_rank: +8,   // rank 1
    on_time_submission: +2,
  },
  negative: {
    non_submission: -10,
    deadline_miss: -10,
    challenge_forfeiture: -15,
  },
} as const;

export const NEGATIVE_RELIABILITY_TAGS = [
  "Missed Challenge Submission",
  "Low Challenge Reliability",
] as const;

/* ---------------- Misc constants re-exported for UI ------------------- */

export const ALLOWED_FILE_TYPES = ["pdf", "ppt", "pptx", "doc", "docx", "zip", "jpg", "jpeg", "png"] as const;
export const COMMITMENT_MESSAGE = {
  title: "Challenge Commitment",
  message: "Failure to submit before the deadline will result in full XP commitment forfeiture.",
} as const;

export { EXECUTION_CONSTANTS };
