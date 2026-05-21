// Scope Connect — Execution Ecosystem (A1–A4): Moderation, removal,
// warning, restoration, replacement, override + mandatory-reason engine,
// audit log, and an RBAC matrix aligned with Auto Join governance.
//
// STRICT ADDITIVE: localStorage-backed, never hard-deletes participants,
// never mutates existing stores' schemas. Soft-status transitions are
// recorded via `projectsExec.participants.setStatus` (which we already own).

import type { RoleId } from "./rbac";
import { projectsExec, type RoomParticipant, type ID } from "./projects-execution-store";

/* ----------------------------- Types ---------------------------------- */

export type UnixMs = number;

export type ModerationActionKind =
  | "flag" | "warn" | "request_removal" | "remove" | "restore"
  | "replace" | "override" | "cooldown" | "mark_abuse" | "force_remove"
  | "escalate";

export type RemovalSeverity = "low" | "medium" | "high";

export type WarningType = "gentle_warning" | "moderate_warning" | "final_warning";

export type ReasonCategory =
  | "fake_profile" | "misconduct" | "duplicate_account" | "non_responsive"
  | "disciplinary_issue" | "academic_restriction" | "spam_behavior"
  | "wrong_skill_fit" | "delivery_failure" | "project_disruption"
  | "inactive_member" | "team_disruption" | "delivery_issue"
  | "late_submission" | "missed_deadline" | "poor_team_behavior"
  | "inactive_reporting" | "admin_error" | "other";

export const REMOVAL_REASONS: ReasonCategory[] = [
  "fake_profile","misconduct","non_responsive","wrong_skill_fit",
  "duplicate_account","disciplinary_issue","delivery_failure",
  "spam_behavior","other",
];

export const FLAG_REASONS: ReasonCategory[] = [
  "spam_behavior","fake_profile","inactive_member","non_responsive",
  "team_disruption","delivery_issue","other",
];

export const WARNING_REASONS: ReasonCategory[] = [
  "non_responsive","late_submission","poor_team_behavior",
  "inactive_reporting","missed_deadline","other",
];

export type ModerationAuditLog = {
  id: ID;
  kind: ModerationActionKind;
  actorUserId: ID;
  actorName: string;
  actorRole: RoleId;
  participantId: ID;
  participantName: string;
  projectId: ID;
  reasonCategory?: ReasonCategory;
  notes?: string;
  severity?: RemovalSeverity;
  warningType?: WarningType;
  at: UnixMs;
};

/* ----------------------------- Storage -------------------------------- */

const KEY = "scope_moderation_audit_v1";
const isBrowser = typeof window !== "undefined";

function read(): ModerationAuditLog[] {
  if (!isBrowser) return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as ModerationAuditLog[]; }
  catch { return []; }
}
function write(items: ModerationAuditLog[]) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: KEY } }));
  } catch { /* noop */ }
}
function uid(prefix: string): ID {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/* --------------------------- RBAC Matrix ------------------------------ */

export type ModerationCapability =
  | "flag" | "warn" | "request_removal" | "escalate"
  | "remove" | "restore" | "replace" | "view_logs"
  | "override" | "force_remove" | "cooldown" | "mark_abuse";

type RoleContext = {
  role: RoleId;
  isTemporaryCoordinator?: boolean;
};

const ROLE_CAPS: Partial<Record<RoleId, ModerationCapability[]>> = {
  student: [],
  faculty_coordinator: ["warn", "remove", "restore", "view_logs"],
  institutional_admin: [
    "warn","remove","replace","restore","override","view_logs",
  ],
  scope_admin: [
    "force_remove","remove","restore","cooldown","mark_abuse",
    "override","view_logs","warn","replace",
  ],
  scope_super_admin: [
    "force_remove","remove","restore","cooldown","mark_abuse",
    "override","view_logs","warn","replace","flag","escalate","request_removal",
  ],
  super_admin: [
    "force_remove","remove","restore","cooldown","mark_abuse",
    "override","view_logs","warn","replace","flag","escalate","request_removal",
  ],
};

const COORDINATOR_CAPS: ModerationCapability[] = [
  "flag", "warn", "request_removal", "escalate",
];

export function canDo(cap: ModerationCapability, ctx: RoleContext): boolean {
  if (ctx.isTemporaryCoordinator && COORDINATOR_CAPS.includes(cap)) return true;
  const caps = ROLE_CAPS[ctx.role] ?? [];
  return caps.includes(cap);
}

export function capsFor(ctx: RoleContext): ModerationCapability[] {
  const base = new Set<ModerationCapability>(ROLE_CAPS[ctx.role] ?? []);
  if (ctx.isTemporaryCoordinator) COORDINATOR_CAPS.forEach((c) => base.add(c));
  return [...base];
}

/* ----------------------- XP Settlement Rules -------------------------- */

export type XpSettlement = {
  refundPercent: number;
  cooldown: boolean;
  reliabilityPenalty: boolean;
};

const XP_SETTLEMENT: Partial<Record<ReasonCategory, XpSettlement>> = {
  fake_profile:       { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  misconduct:         { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  duplicate_account:  { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  disciplinary_issue: { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  spam_behavior:      { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  inactive_reporting: { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  non_responsive:     { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  delivery_failure:   { refundPercent: 0,   cooldown: true,  reliabilityPenalty: true },
  wrong_skill_fit:    { refundPercent: 100, cooldown: false, reliabilityPenalty: false },
  admin_error:        { refundPercent: 100, cooldown: false, reliabilityPenalty: false },
};

export function settlementFor(reason?: ReasonCategory): XpSettlement {
  if (!reason) return { refundPercent: 0, cooldown: false, reliabilityPenalty: false };
  return XP_SETTLEMENT[reason] ?? { refundPercent: 0, cooldown: false, reliabilityPenalty: false };
}

/* ------------------------------ Store --------------------------------- */

export const moderation = {
  logs: {
    all(): ModerationAuditLog[] {
      return read().sort((a, b) => b.at - a.at);
    },
    byProject(projectId: ID): ModerationAuditLog[] {
      return moderation.logs.all().filter((l) => l.projectId === projectId);
    },
    byParticipant(participantId: ID): ModerationAuditLog[] {
      return moderation.logs.all().filter((l) => l.participantId === participantId);
    },
  },

  record(input: Omit<ModerationAuditLog, "id" | "at">): ModerationAuditLog {
    const log: ModerationAuditLog = { ...input, id: uid("mod"), at: Date.now() };
    write([log, ...read()]);
    return log;
  },
};

/* ---------------------- High-level workflows -------------------------- */

export type ActorContext = {
  id: ID;
  name: string;
  role: RoleId;
  isTemporaryCoordinator?: boolean;
};

type Result = { ok: true; settlement?: XpSettlement } | { ok: false; reason: string };

function assert(cap: ModerationCapability, actor: ActorContext): Result | null {
  if (!canDo(cap, actor)) return { ok: false, reason: "You don't have permission for this action." };
  return null;
}

function requireReason(reasonCategory?: ReasonCategory, notes?: string, minLen = 1): Result | null {
  if (!reasonCategory) return { ok: false, reason: "Reason category is required." };
  if (!notes || notes.trim().length < minLen) return { ok: false, reason: `Reason notes are required (min ${minLen} chars).` };
  return null;
}

export function flagParticipant(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  reasonCategory: ReasonCategory;
  notes: string;
}): Result {
  const denied = assert("flag", input.actor); if (denied) return denied;
  const bad = requireReason(input.reasonCategory, input.notes, 5); if (bad) return bad;
  projectsExec.participants.setStatus(input.participant.id, "inactive");
  moderation.record({
    kind: "flag",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    reasonCategory: input.reasonCategory, notes: input.notes,
  });
  return { ok: true };
}

export function warnParticipant(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  warningType: WarningType;
  message: string;
}): Result {
  const denied = assert("warn", input.actor); if (denied) return denied;
  if (!input.message || input.message.trim().length < 5) {
    return { ok: false, reason: "Warning message is required." };
  }
  moderation.record({
    kind: "warn",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    warningType: input.warningType, notes: input.message,
  });
  return { ok: true };
}

export function requestRemoval(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  reasonCategory: ReasonCategory;
  notes: string;
}): Result {
  const denied = assert("request_removal", input.actor); if (denied) return denied;
  const bad = requireReason(input.reasonCategory, input.notes, 10); if (bad) return bad;
  moderation.record({
    kind: "request_removal",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    reasonCategory: input.reasonCategory, notes: input.notes,
  });
  return { ok: true };
}

export function escalateIssue(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  notes: string;
}): Result {
  const denied = assert("escalate", input.actor); if (denied) return denied;
  if (!input.notes || input.notes.trim().length < 5) {
    return { ok: false, reason: "Escalation notes are required." };
  }
  moderation.record({
    kind: "escalate",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    notes: input.notes,
  });
  return { ok: true };
}

export function removeParticipant(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  reasonCategory: ReasonCategory;
  notes: string;
  severity: RemovalSeverity;
  force?: boolean;
}): Result {
  const cap: ModerationCapability = input.force ? "force_remove" : "remove";
  const denied = assert(cap, input.actor); if (denied) return denied;
  const bad = requireReason(input.reasonCategory, input.notes, 20); if (bad) return bad;
  // Soft-delete: never destroy the record.
  projectsExec.participants.setStatus(input.participant.id, "removed");
  // If they were coordinator, release that flag — room can be re-assigned.
  if (input.participant.isTemporaryCoordinator) {
    projectsExec.participants.assignCoordinator(input.participant.id, false);
  }
  const settlement = settlementFor(input.reasonCategory);
  moderation.record({
    kind: input.force ? "force_remove" : "remove",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    reasonCategory: input.reasonCategory, notes: input.notes, severity: input.severity,
  });
  return { ok: true, settlement };
}

export function restoreParticipant(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  notes?: string;
}): Result {
  const denied = assert("restore", input.actor); if (denied) return denied;
  projectsExec.participants.setStatus(input.participant.id, "active");
  moderation.record({
    kind: "restore",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    notes: input.notes,
  });
  return { ok: true };
}

export function replaceParticipant(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  reasonCategory: ReasonCategory;
  notes: string;
}): Result {
  const denied = assert("replace", input.actor); if (denied) return denied;
  const bad = requireReason(input.reasonCategory, input.notes, 10); if (bad) return bad;
  projectsExec.participants.setStatus(input.participant.id, "removed");
  moderation.record({
    kind: "replace",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    reasonCategory: input.reasonCategory, notes: input.notes,
  });
  return { ok: true };
}

export function overrideDecision(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  notes: string;
}): Result {
  const denied = assert("override", input.actor); if (denied) return denied;
  if (!input.notes || input.notes.trim().length < 10) {
    return { ok: false, reason: "Override justification (min 10 chars) is required." };
  }
  moderation.record({
    kind: "override",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    notes: input.notes,
  });
  return { ok: true };
}

export function cooldownParticipant(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  notes: string;
}): Result {
  const denied = assert("cooldown", input.actor); if (denied) return denied;
  if (!input.notes || input.notes.trim().length < 5) {
    return { ok: false, reason: "Cooldown reason is required." };
  }
  moderation.record({
    kind: "cooldown",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    notes: input.notes,
  });
  return { ok: true };
}

export function markAbuse(input: {
  participant: RoomParticipant;
  actor: ActorContext;
  reasonCategory: ReasonCategory;
  notes: string;
}): Result {
  const denied = assert("mark_abuse", input.actor); if (denied) return denied;
  const bad = requireReason(input.reasonCategory, input.notes, 10); if (bad) return bad;
  moderation.record({
    kind: "mark_abuse",
    actorUserId: input.actor.id, actorName: input.actor.name, actorRole: input.actor.role,
    participantId: input.participant.id, participantName: input.participant.userName,
    projectId: input.participant.projectId,
    reasonCategory: input.reasonCategory, notes: input.notes,
  });
  return { ok: true };
}

export const MODERATION_STORAGE_KEY = KEY;
