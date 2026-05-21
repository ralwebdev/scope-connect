// Scope Connect — Execution Ecosystem (Part 3).
// Strict additive Reporting + Contribution + Forfeiture engine, scoped to
// execution projects/participants from projects-execution-store.ts.
// Frontend-only persistence (localStorage + window event dispatch) — mirrors
// governance-store / projects-execution-store conventions so a future MERN
// backend can swap read/write without touching consumers.
//
// Does NOT modify any existing module. Consumes execution participants by ID.

import type { RoleId } from "./rbac";
import { projectsExec, type ID, type UnixMs } from "./projects-execution-store";
import { reliabilityEngine, forfeitureEngine } from "./execution-engines";
import { EXECUTION_CONSTANTS } from "./execution-constants";

/* ------------------------------- Types -------------------------------- */

export type DailyReportStatus = "submitted" | "reviewed" | "flagged";

export type ExecDailyReport = {
  id: ID;
  projectId: ID;
  participantId: ID;
  userId: ID;
  userName: string;
  /** YYYY-MM-DD calendar key in local TZ. */
  day: string;
  submittedAt: UnixMs;
  status: DailyReportStatus;
  data: {
    todayWork: string;
    deliverablesSubmitted: string;
    blockers: string;
    hoursSpent: number;
    tomorrowPlan: string;
    proofLinks?: string[];
    attachments?: { name: string; url: string }[];
  };
  edited?: boolean;
  reviewedBy?: { id: ID; name: string; role: RoleId };
  reviewNote?: string;
};

export type ReportingWarningLevel = 1 | 2 | 3 | 4 | 5;
export type ReportingWarningStatus =
  | "warning_issued" | "high_risk" | "inactive" | "at_risk" | "forfeited";

export const REPORTING_LADDER: Array<{
  day: ReportingWarningLevel;
  status: ReportingWarningStatus;
  actions: string[];
}> = [
  { day: 1, status: "warning_issued", actions: ["warning_notification", "reliability_score_penalty_minor"] },
  { day: 2, status: "high_risk", actions: ["urgent_warning_notification", "temporary_coordinator_alert", "faculty_alert", "reliability_score_penalty_medium"] },
  { day: 3, status: "inactive", actions: ["inactive_flag", "institution_admin_alert", "scope_admin_alert", "project_risk_marker"] },
  { day: 4, status: "at_risk", actions: ["final_commitment_warning", "forfeiture_risk_notification"] },
  { day: 5, status: "forfeited", actions: ["full_commitment_forfeiture", "project_participation_restriction", "cooldown_start"] },
];

export type ExecReportingWarning = {
  id: ID;
  projectId: ID;
  participantId: ID;
  userId: ID;
  level: ReportingWarningLevel;
  status: ReportingWarningStatus;
  actions: string[];
  missedDays: number;
  at: UnixMs;
  resolved?: boolean;
  resolvedAt?: UnixMs;
};

export type PeerReviewCriterion =
  "collaboration" | "responsiveness" | "task_execution" | "consistency" | "communication";

export type ExecPeerReview = {
  id: ID;
  projectId: ID;
  reviewerUserId: ID;
  reviewerName: string;
  revieweeUserId: ID;
  revieweeName: string;
  scores: Record<PeerReviewCriterion, number>; // 0..100 each
  note?: string;
  at: UnixMs;
};

export type MentorReviewCriterion =
  "execution_quality" | "task_completion" | "reliability" | "initiative" | "communication";

export type ExecMentorReview = {
  id: ID;
  projectId: ID;
  reviewerUserId: ID;
  reviewerName: string;
  reviewerRole: RoleId;
  revieweeUserId: ID;
  revieweeName: string;
  scores: Record<MentorReviewCriterion, number>;
  note?: string;
  at: UnixMs;
};

export type ContributionBand =
  "elite_contributor" | "high_contributor" | "weak_contributor" | "inactive_contributor";

export const CONTRIBUTION_BANDS: Record<ContributionBand, {
  min: number; max: number; multiplier: number; badge: string;
}> = {
  elite_contributor:    { min: 90, max: 100, multiplier: 1.5, badge: "Elite Contributor" },
  high_contributor:     { min: 70, max: 89,  multiplier: 1.0, badge: "Strong Contributor" },
  weak_contributor:     { min: 40, max: 69,  multiplier: 0.4, badge: "Low Contributor" },
  inactive_contributor: { min: 0,  max: 39,  multiplier: 0,   badge: "Inactive Contributor" },
};

export type ExecContributionScore = {
  id: ID;
  projectId: ID;
  participantId: ID;
  userId: ID;
  score: number; // 0..100
  band: ContributionBand;
  components: {
    deliverables: number;        // 0..100
    reportingConsistency: number;
    peer: number;
    mentor: number;
    engagement: number;
  };
  updatedAt: UnixMs;
};

export type ExecCooldown = {
  id: ID;
  userId: ID;
  startedAt: UnixMs;
  endsAt: UnixMs;
  reason: "full_forfeiture" | "ghost_participation" | "project_abandonment";
  projectId?: ID;
};

/* ----------------------------- Storage -------------------------------- */

const KEYS = {
  reports:    "scope_exec3_daily_reports_v1",
  warnings:   "scope_exec3_warnings_v1",
  peer:       "scope_exec3_peer_reviews_v1",
  mentor:     "scope_exec3_mentor_reviews_v1",
  scores:     "scope_exec3_contribution_scores_v1",
  cooldowns:  "scope_exec3_cooldowns_v1",
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

export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function expectedDayKeys(fromTs: number, toTs: number = Date.now()): string[] {
  const out: string[] = [];
  const start = new Date(fromTs); start.setHours(0, 0, 0, 0);
  const end = new Date(toTs); end.setHours(0, 0, 0, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(dayKey(d.getTime()));
  }
  return out;
}

/* --------------------- Mentor / reviewer permissions ----------------- */

const MENTOR_REVIEWERS: RoleId[] = [
  "faculty_coordinator", "institutional_admin", "scope_admin", "super_admin", "scope_super_admin",
];

export function canMentorReview(role: RoleId, isTemporaryCoordinator: boolean): boolean {
  return isTemporaryCoordinator || MENTOR_REVIEWERS.includes(role);
}

/* ------------------------------ Store --------------------------------- */

export const execReporting = {
  /* ---------- Daily Reports ---------- */
  reports: {
    all(): ExecDailyReport[] { return read<ExecDailyReport>(KEYS.reports); },
    byProject(projectId: ID) {
      return execReporting.reports.all().filter((r) => r.projectId === projectId)
        .sort((a, b) => b.submittedAt - a.submittedAt);
    },
    byParticipant(participantId: ID) {
      return execReporting.reports.all().filter((r) => r.participantId === participantId)
        .sort((a, b) => b.submittedAt - a.submittedAt);
    },
    todayFor(participantId: ID) {
      const k = dayKey();
      return execReporting.reports.all().find((r) => r.participantId === participantId && r.day === k);
    },
    submit(input: {
      projectId: ID; participantId: ID; userId: ID; userName: string;
      data: ExecDailyReport["data"];
    }): { ok: true; report: ExecDailyReport } | { ok: false; reason: string } {
      const text = input.data.todayWork?.trim() ?? "";
      if (text.length < 20) return { ok: false, reason: "Today's work must be at least 20 characters." };
      if (!input.data.deliverablesSubmitted?.trim()) return { ok: false, reason: "Deliverables field is required." };
      if (!input.data.blockers?.trim()) return { ok: false, reason: "Blockers/dependencies field is required." };
      if (!input.data.tomorrowPlan?.trim()) return { ok: false, reason: "Tomorrow's plan is required." };
      if (typeof input.data.hoursSpent !== "number" || input.data.hoursSpent < 0 || input.data.hoursSpent > 24) {
        return { ok: false, reason: "Hours spent must be between 0 and 24." };
      }

      const all = execReporting.reports.all();
      const k = dayKey();
      const existing = all.find((r) => r.participantId === input.participantId && r.day === k);
      if (existing) {
        const updated: ExecDailyReport = { ...existing, data: input.data, submittedAt: Date.now(), edited: true };
        write(KEYS.reports, all.map((r) => r.id === existing.id ? updated : r));
        reliabilityEngine.log({ userId: input.userId, behaviour: "daily_reporting", sourceKind: "report", sourceId: existing.id });
        execReporting._touchActivity(input.participantId);
        execReporting._sweepWarnings(input.projectId, input.participantId);
        return { ok: true, report: updated };
      }

      const r: ExecDailyReport = {
        id: uid("dr"),
        projectId: input.projectId,
        participantId: input.participantId,
        userId: input.userId,
        userName: input.userName,
        day: k,
        submittedAt: Date.now(),
        status: "submitted",
        data: input.data,
      };
      write(KEYS.reports, [r, ...all]);
      reliabilityEngine.log({ userId: input.userId, behaviour: "daily_reporting", sourceKind: "report", sourceId: r.id });
      execReporting._touchActivity(input.participantId);
      execReporting._sweepWarnings(input.projectId, input.participantId);
      return { ok: true, report: r };
    },
    review(reportId: ID, reviewer: { id: ID; name: string; role: RoleId }, note?: string) {
      const all = execReporting.reports.all();
      const i = all.findIndex((r) => r.id === reportId);
      if (i === -1) return;
      all[i] = { ...all[i], status: "reviewed", reviewedBy: reviewer, reviewNote: note };
      write(KEYS.reports, all);
    },
  },

  /* ---------- Compliance + escalation ---------- */
  compliance: {
    missedFor(participantId: ID): { expected: string[]; submitted: string[]; missed: string[] } {
      const p = projectsExec.participants.all().find((x) => x.id === participantId);
      if (!p) return { expected: [], submitted: [], missed: [] };
      const expected = expectedDayKeys(p.joinedAt);
      const submitted = execReporting.reports.byParticipant(participantId).map((r) => r.day);
      const today = dayKey();
      const missed = expected.filter((d) => !submitted.includes(d) && d !== today);
      return { expected, submitted, missed };
    },
    missedDays(participantId: ID): number {
      return execReporting.compliance.missedFor(participantId).missed.length;
    },
    statusFor(participantId: ID): { level: ReportingWarningLevel | 0; status: ReportingWarningStatus | "ok"; missedDays: number } {
      const missed = execReporting.compliance.missedDays(participantId);
      if (missed <= 0) return { level: 0, status: "ok", missedDays: 0 };
      const rung = [...REPORTING_LADDER].reverse().find((r) => missed >= r.day) ?? REPORTING_LADDER[0];
      return { level: rung.day, status: rung.status, missedDays: missed };
    },
  },

  /* ---------- Warnings ---------- */
  warnings: {
    all(): ExecReportingWarning[] { return read<ExecReportingWarning>(KEYS.warnings); },
    byParticipant(participantId: ID) {
      return execReporting.warnings.all().filter((w) => w.participantId === participantId)
        .sort((a, b) => b.at - a.at);
    },
    byProject(projectId: ID) {
      return execReporting.warnings.all().filter((w) => w.projectId === projectId);
    },
    /** Idempotently evaluate the escalation ladder for every active participant. */
    evaluateAll() {
      const all = execReporting.warnings.all();
      const next = [...all];
      for (const part of projectsExec.participants.all().filter((p) => p.status === "active")) {
        const missed = execReporting.compliance.missedDays(part.id);
        for (const rung of REPORTING_LADDER) {
          if (missed >= rung.day) {
            const exists = next.some((w) =>
              w.participantId === part.id && w.level === rung.day && !w.resolved);
            if (!exists) {
              next.unshift({
                id: uid("warn"),
                projectId: part.projectId,
                participantId: part.id,
                userId: part.userId,
                level: rung.day,
                status: rung.status,
                actions: rung.actions,
                missedDays: missed,
                at: Date.now(),
              });
              // Reliability penalty per rung
              if (rung.day === 1) {
                reliabilityEngine.log({ userId: part.userId, behaviour: "missed_reporting", sourceKind: "project", sourceId: part.projectId });
              } else if (rung.day === 2 || rung.day === 3) {
                reliabilityEngine.log({ userId: part.userId, behaviour: "missed_reporting", sourceKind: "project", sourceId: part.projectId });
              } else if (rung.day === 5) {
                // Trigger full forfeiture.
                execReporting._executeForfeiture(part.projectId, part.id, part.userId, part.xpCommittedAmount, "full_forfeiture");
              }
            }
          }
        }
      }
      if (next.length !== all.length) write(KEYS.warnings, next);
      return next;
    },
  },

  /* ---------- Peer Reviews ---------- */
  peer: {
    all(): ExecPeerReview[] { return read<ExecPeerReview>(KEYS.peer); },
    byProject(projectId: ID) {
      return execReporting.peer.all().filter((r) => r.projectId === projectId);
    },
    forReviewee(projectId: ID, revieweeUserId: ID) {
      return execReporting.peer.byProject(projectId).filter((r) => r.revieweeUserId === revieweeUserId);
    },
    submit(input: Omit<ExecPeerReview, "id" | "at">): { ok: true; review: ExecPeerReview } | { ok: false; reason: string } {
      if (input.reviewerUserId === input.revieweeUserId) {
        return { ok: false, reason: "Self-review is blocked." };
      }
      const exists = execReporting.peer.byProject(input.projectId).some(
        (r) => r.reviewerUserId === input.reviewerUserId && r.revieweeUserId === input.revieweeUserId
      );
      if (exists) return { ok: false, reason: "You already reviewed this participant." };
      // Bias detection (lightweight): reject all-zero or all-perfect scores.
      const vals = Object.values(input.scores);
      if (vals.every((v) => v === 0) || vals.every((v) => v === 100)) {
        return { ok: false, reason: "Scores look biased — vary per criterion." };
      }
      const r: ExecPeerReview = { ...input, id: uid("peer"), at: Date.now() };
      write(KEYS.peer, [r, ...execReporting.peer.all()]);
      reliabilityEngine.log({ userId: input.revieweeUserId, behaviour: "peer_validation", sourceKind: "project", sourceId: input.projectId });
      return { ok: true, review: r };
    },
  },

  /* ---------- Mentor Reviews ---------- */
  mentor: {
    all(): ExecMentorReview[] { return read<ExecMentorReview>(KEYS.mentor); },
    byProject(projectId: ID) {
      return execReporting.mentor.all().filter((r) => r.projectId === projectId);
    },
    forReviewee(projectId: ID, revieweeUserId: ID) {
      return execReporting.mentor.byProject(projectId).filter((r) => r.revieweeUserId === revieweeUserId);
    },
    submit(input: Omit<ExecMentorReview, "id" | "at">): { ok: true; review: ExecMentorReview } | { ok: false; reason: string } {
      if (!canMentorReview(input.reviewerRole, false) && input.reviewerUserId !== input.revieweeUserId) {
        // Note: temporary coordinator check happens in UI before calling.
      }
      const r: ExecMentorReview = { ...input, id: uid("mrv"), at: Date.now() };
      write(KEYS.mentor, [r, ...execReporting.mentor.all()]);
      reliabilityEngine.log({ userId: input.revieweeUserId, behaviour: "mentor_validation", sourceKind: "project", sourceId: input.projectId });
      return { ok: true, review: r };
    },
  },

  /* ---------- Contribution Scores ---------- */
  scores: {
    all(): ExecContributionScore[] { return read<ExecContributionScore>(KEYS.scores); },
    byProject(projectId: ID) {
      return execReporting.scores.all().filter((s) => s.projectId === projectId);
    },
    forParticipant(participantId: ID) {
      return execReporting.scores.all().find((s) => s.participantId === participantId);
    },
    /** Recompute rolling contribution score for a participant. */
    recompute(participantId: ID): ExecContributionScore | null {
      const part = projectsExec.participants.all().find((p) => p.id === participantId);
      if (!part) return null;

      // Deliverables component: % of completed tasks assigned to this user in the project.
      const userTasks = projectsExec.tasks.byProject(part.projectId)
        .filter((t) => t.assignedToUserId === part.userId);
      const totalTasks = userTasks.length;
      const completed = userTasks.filter((t) => t.status === "completed").length;
      const deliverables = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);

      // Reporting consistency: submitted / expected (excluding today).
      const { expected, submitted } = execReporting.compliance.missedFor(participantId);
      const expectedCount = Math.max(1, expected.length - 1);
      const submittedYesterdayOrEarlier = submitted.filter((d) => d !== dayKey()).length;
      const reportingConsistency = Math.min(100, Math.round((submittedYesterdayOrEarlier / expectedCount) * 100));

      // Peer / Mentor: average of all received scores across all criteria.
      const peerReviews = execReporting.peer.forReviewee(part.projectId, part.userId);
      const peer = peerReviews.length === 0 ? 0 : Math.round(
        peerReviews.reduce((acc, r) => acc + (Object.values(r.scores).reduce((a, b) => a + b, 0) / 5), 0) / peerReviews.length
      );
      const mentorReviews = execReporting.mentor.forReviewee(part.projectId, part.userId);
      const mentor = mentorReviews.length === 0 ? 0 : Math.round(
        mentorReviews.reduce((acc, r) => acc + (Object.values(r.scores).reduce((a, b) => a + b, 0) / 5), 0) / mentorReviews.length
      );

      // Engagement: derived from recency of last activity (within 7 days → 100, decay to 0 at 21d).
      const last = part.lastActivityAt ?? part.joinedAt;
      const daysSince = (Date.now() - last) / 86400000;
      const engagement = daysSince <= 7 ? 100 : daysSince >= 21 ? 0 : Math.round(100 - ((daysSince - 7) / 14) * 100);

      // Spec weights: deliverables 40, reporting 20, peer 15, mentor 15, engagement 10.
      const score = Math.round(
        deliverables * 0.40 +
        reportingConsistency * 0.20 +
        peer * 0.15 +
        mentor * 0.15 +
        engagement * 0.10
      );

      const band = bandForScore(score);

      const existing = execReporting.scores.forParticipant(participantId);
      const record: ExecContributionScore = {
        id: existing?.id ?? uid("cs"),
        projectId: part.projectId,
        participantId,
        userId: part.userId,
        score: Math.max(0, Math.min(100, score)),
        band,
        components: {
          deliverables,
          reportingConsistency,
          peer,
          mentor,
          engagement,
        },
        updatedAt: Date.now(),
      };
      const all = execReporting.scores.all();
      const i = all.findIndex((s) => s.id === record.id);
      if (i === -1) write(KEYS.scores, [record, ...all]);
      else { all[i] = record; write(KEYS.scores, all); }
      return record;
    },
  },

  /* ---------- Cooldowns ---------- */
  cooldowns: {
    all(): ExecCooldown[] { return read<ExecCooldown>(KEYS.cooldowns); },
    activeFor(userId: ID): ExecCooldown | undefined {
      const now = Date.now();
      return execReporting.cooldowns.all().find((c) => c.userId === userId && c.endsAt > now);
    },
    start(input: { userId: ID; reason: ExecCooldown["reason"]; projectId?: ID; days?: number }): ExecCooldown {
      const days = input.days ?? EXECUTION_CONSTANTS.COOLDOWN_AFTER_INACTIVITY_DAYS;
      const c: ExecCooldown = {
        id: uid("cd"),
        userId: input.userId,
        startedAt: Date.now(),
        endsAt: Date.now() + days * 86400000,
        reason: input.reason,
        projectId: input.projectId,
      };
      write(KEYS.cooldowns, [c, ...execReporting.cooldowns.all()]);
      return c;
    },
  },

  /* ---------- Reward distribution (preview) ---------- */
  reward: {
    /** Compute payout per active participant from a project's reward pool. */
    distribute(projectId: ID): Array<{ participantId: ID; userId: ID; userName: string; score: number; band: ContributionBand; payout: number }> {
      const project = projectsExec.projects.get(projectId);
      if (!project) return [];
      const parts = projectsExec.participants.byProject(projectId).filter((p) => p.status === "active");
      const rows = parts.map((p) => {
        const cs = execReporting.scores.forParticipant(p.id) ?? execReporting.scores.recompute(p.id);
        const score = cs?.score ?? 0;
        const band = cs?.band ?? bandForScore(score);
        return { participantId: p.id, userId: p.userId, userName: p.userName, score, band };
      });
      // Weighted by score × band multiplier.
      const weights = rows.map((r) => r.score * CONTRIBUTION_BANDS[r.band].multiplier);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      return rows.map((r, i) => ({
        ...r,
        payout: totalWeight === 0 ? 0 : Math.round((weights[i] / totalWeight) * project.rewardPoolXp),
      }));
    },
  },

  /* ---------- Internal ---------- */
  _touchActivity(participantId: ID) {
    const all = projectsExec.participants.all();
    const i = all.findIndex((p) => p.id === participantId);
    if (i === -1) return;
    all[i] = { ...all[i], lastActivityAt: Date.now() };
    // Use the existing store's persistence path via a direct write key.
    try {
      localStorage.setItem("scope_exec2_room_participants_v1", JSON.stringify(all));
      window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: "scope_exec2_room_participants_v1" } }));
    } catch { /* noop */ }
  },
  _sweepWarnings(projectId: ID, participantId: ID) {
    const all = execReporting.warnings.all();
    const missed = execReporting.compliance.missedDays(participantId);
    const updated = all.map((w) => {
      if (w.participantId !== participantId || w.resolved) return w;
      if (missed < w.level) return { ...w, resolved: true, resolvedAt: Date.now() };
      return w;
    });
    write(KEYS.warnings, updated);
    void projectId;
  },
  _executeForfeiture(projectId: ID, participantId: ID, userId: ID, amount: number, reason: ExecCooldown["reason"]) {
    // Mark participant as forfeited.
    projectsExec.participants.setStatus(participantId, "forfeited");
    projectsExec.logs.record({
      projectId, userId, action: "xp_forfeited",
      note: `Full Commitment Forfeiture (${amount} XP) — ${reason}`,
    });
    // Forfeiture engine + reliability.
    forfeitureEngine.projectInactivity({
      projectId, userId,
      commitmentId: `inline_${participantId}`,
      amount,
    });
    // Start cooldown.
    execReporting.cooldowns.start({ userId, projectId, reason });
  },
};

export function bandForScore(score: number): ContributionBand {
  if (score >= 90) return "elite_contributor";
  if (score >= 70) return "high_contributor";
  if (score >= 40) return "weak_contributor";
  return "inactive_contributor";
}

export const EXEC3_STORAGE_KEYS = KEYS;
