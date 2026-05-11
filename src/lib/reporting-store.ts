// Daily Reporting Portal — store, penalty engine, recovery flow.
// Trust-first: missed reports trigger an escalation ladder.
// Storage: localStorage. Backend contract: /mnt/documents/scope-connect-backend-contract/11-daily-reporting.md

import type { RoleId } from "./rbac";

export type ReportProjectType = "coding" | "design" | "content" | "other";

export type ReportAssignment = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectType: ReportProjectType;
  teamMode: boolean;
  /** When daily reporting started (joining date). */
  startedAt: number;
  /** When reporting ends (project completion). null = ongoing. */
  endedAt: number | null;
  /** User this assignment belongs to. */
  userId: string;
  userName: string;
  /** Mentor / supervisor / faculty handle (optional). */
  mentor?: string;
  /** Institution + scope hooks for cross-views. */
  institution?: string;
};

export type DailyReport = {
  id: string;
  assignmentId: string;
  /** Calendar day key in IST (YYYY-MM-DD) — uniqueness key per assignment+day. */
  day: string;
  submittedAt: number;
  data: Record<string, unknown>;
  edited?: boolean;
  mentorReview?: { by: string; note: string; at: number; status: "approved" | "needs_revision" };
};

export type PenaltyAction =
  | "warning_notification"
  | "streak_warning"
  | "trust_score_deduction"
  | "temporary_visibility_reduction"
  | "project_flagged"
  | "mentor_review_required"
  | "automatic_project_removal_review"
  | "certificate_restriction"
  | "future_application_cooldown";

export type PenaltyEvent = {
  id: string;
  assignmentId: string;
  level: 1 | 2 | 3 | 5;
  missedDays: number;
  actions: PenaltyAction[];
  at: number;
  /** Recovery state. */
  resolved?: boolean;
  resolvedAt?: number;
};

export type RecoveryRequest = {
  id: string;
  assignmentId: string;
  reason: string;
  backlogDays: string[]; // day keys queued for backlog completion
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  reviewedAt?: number;
  reviewer?: string;
  reviewerNote?: string;
};

/* --------------------------- Penalty ladder --------------------------- */

export type LadderRung = { level: 1 | 2 | 3 | 5; actions: PenaltyAction[] };

export const PENALTY_LADDER: LadderRung[] = [
  { level: 1, actions: ["warning_notification", "streak_warning"] },
  { level: 2, actions: ["trust_score_deduction", "temporary_visibility_reduction"] },
  { level: 3, actions: ["project_flagged", "mentor_review_required"] },
  { level: 5, actions: ["automatic_project_removal_review", "certificate_restriction", "future_application_cooldown"] },
];

export const TRUST_SCORE_BASE = 100;
export const TRUST_SCORE_DEDUCTION = 8;

/* --------------------------- Storage --------------------------- */

const KEYS = {
  assignments: "scope_report_assignments_v1",
  reports: "scope_daily_reports_v1",
  penalties: "scope_report_penalties_v1",
  recoveries: "scope_report_recoveries_v1",
  trust: "scope_trust_score_v1",
} as const;

const isBrowser = typeof window !== "undefined";

function read<T>(k: string, fb: T): T {
  if (!isBrowser) return fb;
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; }
}
function write<T>(k: string, v: T) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: k } }));
  } catch { /* noop */ }
}

/** Calendar day key in local TZ (frontend stand-in for IST server time). */
export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(fromTs: number, toTs: number): string[] {
  const out: string[] = [];
  const start = new Date(fromTs); start.setHours(0, 0, 0, 0);
  const end = new Date(toTs); end.setHours(0, 0, 0, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(dayKey(d.getTime()));
  }
  return out;
}

/* --------------------------- Seed assignments --------------------------- */
// Demo assignments ensure dashboards are non-empty on first load for any user.

const SEED_ASSIGNMENTS: ReportAssignment[] = [
  {
    id: "asg_seed_1",
    projectId: "proj_seed_a",
    projectTitle: "Campus Marketplace MVP",
    projectType: "coding",
    teamMode: true,
    startedAt: Date.now() - 86400000 * 6,
    endedAt: null,
    userId: "seed_u1",
    userName: "Aarav Mehta",
    mentor: "Dr. Iyer",
    institution: "BITS Pilani",
  },
  {
    id: "asg_seed_2",
    projectId: "proj_seed_b",
    projectTitle: "Design Sprint — Eco App",
    projectType: "design",
    teamMode: false,
    startedAt: Date.now() - 86400000 * 4,
    endedAt: null,
    userId: "seed_u2",
    userName: "Niharika Rao",
    mentor: "Prof. Khanna",
    institution: "NID Ahmedabad",
  },
  {
    id: "asg_seed_3",
    projectId: "proj_seed_c",
    projectTitle: "Magazine — Vol 12 Editorial",
    projectType: "content",
    teamMode: true,
    startedAt: Date.now() - 86400000 * 8,
    endedAt: null,
    userId: "seed_u3",
    userName: "Kabir Sen",
    mentor: "Editor Bose",
    institution: "St. Xavier's Kolkata",
  },
];

/* --------------------------- Public API --------------------------- */

export const reporting = {
  // -------- Assignments --------
  assignments(): ReportAssignment[] {
    const stored = read<ReportAssignment[]>(KEYS.assignments, []);
    return stored.length ? stored : SEED_ASSIGNMENTS;
  },
  assignmentsForUser(userId: string | null | undefined): ReportAssignment[] {
    if (!userId) return [];
    return reporting.assignments().filter((a) => a.userId === userId);
  },
  assignmentsForMentor(mentorName: string): ReportAssignment[] {
    return reporting.assignments().filter((a) => a.mentor === mentorName);
  },
  assignmentsForInstitution(inst: string): ReportAssignment[] {
    return reporting.assignments().filter((a) => a.institution === inst);
  },
  enrol(input: Omit<ReportAssignment, "id" | "startedAt" | "endedAt"> & { startedAt?: number }): ReportAssignment {
    const all = reporting.assignments();
    const a: ReportAssignment = {
      ...input,
      id: `asg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      startedAt: input.startedAt ?? Date.now(),
      endedAt: null,
    };
    write(KEYS.assignments, [a, ...all]);
    return a;
  },
  complete(id: string) {
    const all = reporting.assignments().map((a) => a.id === id ? { ...a, endedAt: Date.now() } : a);
    write(KEYS.assignments, all);
  },

  // -------- Reports --------
  reports(): DailyReport[] {
    return read<DailyReport[]>(KEYS.reports, []);
  },
  reportsFor(assignmentId: string): DailyReport[] {
    return reporting.reports().filter((r) => r.assignmentId === assignmentId).sort((a, b) => b.submittedAt - a.submittedAt);
  },
  todayReport(assignmentId: string): DailyReport | undefined {
    const k = dayKey();
    return reporting.reports().find((r) => r.assignmentId === assignmentId && r.day === k);
  },
  submit(input: { assignmentId: string; data: Record<string, unknown> }): DailyReport {
    const list = reporting.reports();
    const k = dayKey();
    const existing = list.find((r) => r.assignmentId === input.assignmentId && r.day === k);
    if (existing) {
      const updated = { ...existing, data: input.data, submittedAt: Date.now(), edited: true };
      write(KEYS.reports, list.map((r) => r.id === existing.id ? updated : r));
      return updated;
    }
    const r: DailyReport = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      assignmentId: input.assignmentId,
      day: k,
      submittedAt: Date.now(),
      data: input.data,
    };
    write(KEYS.reports, [r, ...list]);
    // Submitting on time clears any open level-1 warning for this assignment.
    reporting._sweepPenalties();
    return r;
  },

  // -------- Compliance / penalty --------
  /** Days expected so far (today inclusive) minus reports submitted. */
  missedDaysFor(assignmentId: string): { missedDays: number; missedKeys: string[]; expectedKeys: string[] } {
    const a = reporting.assignments().find((x) => x.id === assignmentId);
    if (!a) return { missedDays: 0, missedKeys: [], expectedKeys: [] };
    const upper = a.endedAt ?? Date.now();
    const expected = daysBetween(a.startedAt, upper);
    const submitted = new Set(reporting.reportsFor(assignmentId).map((r) => r.day));
    const missed = expected.filter((d) => !submitted.has(d) && d !== dayKey());
    return { missedDays: missed.length, missedKeys: missed, expectedKeys: expected };
  },
  penalties(): PenaltyEvent[] {
    return read<PenaltyEvent[]>(KEYS.penalties, []);
  },
  penaltiesFor(assignmentId: string): PenaltyEvent[] {
    return reporting.penalties().filter((p) => p.assignmentId === assignmentId);
  },
  /** Recompute applicable penalty rung for every assignment. Idempotent per (assignment, level). */
  evaluate(): PenaltyEvent[] {
    const events = reporting.penalties();
    const next = [...events];
    for (const a of reporting.assignments()) {
      const { missedDays } = reporting.missedDaysFor(a.id);
      for (const rung of PENALTY_LADDER) {
        if (missedDays >= rung.level) {
          const exists = events.some((e) => e.assignmentId === a.id && e.level === rung.level && !e.resolved);
          if (!exists) {
            next.unshift({
              id: `pen_${Date.now()}_${rung.level}_${Math.random().toString(36).slice(2, 5)}`,
              assignmentId: a.id,
              level: rung.level,
              missedDays,
              actions: rung.actions,
              at: Date.now(),
            });
            if (rung.actions.includes("trust_score_deduction")) {
              reporting._deductTrust(a.userId);
            }
          }
        }
      }
    }
    write(KEYS.penalties, next);
    return next;
  },
  _sweepPenalties() {
    // If missedDays drops back below a rung after a report, mark its open events resolved.
    const all = reporting.penalties();
    const updated = all.map((p) => {
      const { missedDays } = reporting.missedDaysFor(p.assignmentId);
      if (!p.resolved && missedDays < p.level) {
        return { ...p, resolved: true, resolvedAt: Date.now() };
      }
      return p;
    });
    write(KEYS.penalties, updated);
  },

  // -------- Trust score --------
  trustScore(userId: string): number {
    const map = read<Record<string, number>>(KEYS.trust, {});
    return map[userId] ?? TRUST_SCORE_BASE;
  },
  _deductTrust(userId: string) {
    const map = read<Record<string, number>>(KEYS.trust, {});
    const cur = map[userId] ?? TRUST_SCORE_BASE;
    map[userId] = Math.max(0, cur - TRUST_SCORE_DEDUCTION);
    write(KEYS.trust, map);
  },

  // -------- Recovery --------
  recoveries(): RecoveryRequest[] {
    return read<RecoveryRequest[]>(KEYS.recoveries, []);
  },
  recoveriesFor(assignmentId: string): RecoveryRequest[] {
    return reporting.recoveries().filter((r) => r.assignmentId === assignmentId);
  },
  requestRecovery(input: { assignmentId: string; reason: string; backlogDays: string[] }): RecoveryRequest {
    const r: RecoveryRequest = {
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      assignmentId: input.assignmentId,
      reason: input.reason,
      backlogDays: input.backlogDays,
      status: "pending",
      requestedAt: Date.now(),
    };
    write(KEYS.recoveries, [r, ...reporting.recoveries()]);
    return r;
  },
  reviewRecovery(id: string, decision: "approved" | "rejected", reviewer: string, note?: string) {
    const list = reporting.recoveries().map((r) => r.id === id
      ? { ...r, status: decision, reviewedAt: Date.now(), reviewer, reviewerNote: note }
      : r);
    write(KEYS.recoveries, list);
    if (decision === "approved") {
      // Mark related penalties resolved.
      const rec = list.find((r) => r.id === id);
      if (rec) {
        const pens = reporting.penalties().map((p) => p.assignmentId === rec.assignmentId
          ? { ...p, resolved: true, resolvedAt: Date.now() }
          : p);
        write(KEYS.penalties, pens);
      }
    }
  },

  // -------- Streak --------
  streakFor(assignmentId: string): number {
    const submittedDays = new Set(reporting.reportsFor(assignmentId).map((r) => r.day));
    let streak = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d.getTime());
      if (submittedDays.has(k)) streak++;
      else break;
    }
    return streak;
  },
};

export function rolesAllowedToReview(role: RoleId): boolean {
  return ["faculty_coordinator", "institutional_admin", "scope_admin", "scope_super_admin", "super_admin"].includes(role);
}
