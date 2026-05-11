// Governance store — Challenges + Projects + Opportunities
// Trust-first: creation rights ≠ publishing rights. All public content
// passes through draft → moderation_review → approved → published.
// Storage: localStorage (frontend-only, matches contract-first plan).
// Backend contract: see /mnt/documents/scope-connect-backend-contract/10-governance-content.md

import type { RoleId } from "./rbac";

export type ContentEntity = "challenge" | "project" | "opportunity";
export type ContentStage = "draft" | "moderation_review" | "approved" | "published" | "rejected";

export type ContentItem = {
  id: string;
  entity: ContentEntity;
  /** Resolved + denormalized for the dynamic form schema (challenge_type, project_type, opportunity_type, etc). */
  data: Record<string, unknown>;
  stage: ContentStage;
  /** RoleId of the creator at time of submission. */
  createdByRole: RoleId;
  createdByName: string;
  createdByEmail?: string;
  createdAt: number;
  updatedAt: number;
  /** Audit trail of stage transitions. */
  events: GovernanceEvent[];
  /** Moderation comment from latest reviewer. */
  reviewerNote?: string;
  /** Visibility scope hint (e.g. "regional", "internal_campus"). */
  scopeTag?: string;
};

export type GovernanceEvent = {
  at: number;
  by: string;
  byRole: RoleId;
  action: "submitted" | "approved" | "published" | "rejected" | "edited" | "draft_saved";
  note?: string;
};

/* --------------------------- Authority Matrix --------------------------- */

type AuthorityRule = {
  /** Can author and submit for review. */
  canCreate: boolean;
  /** Can save drafts that an admin later submits on their behalf. */
  canDraft?: boolean;
  /** Allowed creation scope tags (purely informational, surfaced in UI). */
  scopes?: string[];
};

const MATRIX: Record<ContentEntity, Partial<Record<RoleId, AuthorityRule>>> = {
  challenge: {
    super_admin: { canCreate: true, scopes: ["platform_wide", "national", "sponsored"] },
    scope_super_admin: { canCreate: true, scopes: ["platform_wide", "national", "sponsored"] },
    scope_admin: { canCreate: true, scopes: ["regional", "institution_specific", "onboarding"] },
    institutional_admin: { canCreate: true, scopes: ["internal_campus", "department_level"] },
    faculty_coordinator: { canCreate: false, canDraft: true },
  },
  project: {
    super_admin: { canCreate: true },
    scope_super_admin: { canCreate: true },
    scope_admin: { canCreate: true },
    institutional_admin: { canCreate: true, scopes: ["academic", "departmental", "internal"] },
    faculty_coordinator: { canCreate: false, canDraft: true },
  },
  opportunity: {
    super_admin: { canCreate: true },
    scope_super_admin: { canCreate: true },
    institutional_admin: { canCreate: true, scopes: ["internal_roles", "ambassador_programs", "student_volunteering"] },
    // scope_admin can assist but cannot publish opportunities directly
    scope_admin: { canCreate: false, canDraft: true },
  },
};

export function authorityFor(entity: ContentEntity, role: RoleId): AuthorityRule {
  return MATRIX[entity]?.[role] ?? { canCreate: false };
}

/** Roles allowed to moderate the queue. */
export function canModerate(role: RoleId): boolean {
  return role === "scope_admin" || role === "scope_super_admin" || role === "super_admin";
}

/** Only super-admin tier can perform final publish. */
export function canPublish(role: RoleId): boolean {
  return role === "scope_super_admin" || role === "super_admin";
}

/* --------------------------- Storage --------------------------- */

const KEY = "scope_governance_items_v1";
const isBrowser = typeof window !== "undefined";

function read(): ContentItem[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as ContentItem[];
  } catch {
    return [];
  }
}

function write(items: ContentItem[]) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { key: KEY } }));
  } catch {
    /* noop */
  }
}

export const governance = {
  all(): ContentItem[] {
    return read().sort((a, b) => b.updatedAt - a.updatedAt);
  },
  byEntity(entity: ContentEntity): ContentItem[] {
    return governance.all().filter((i) => i.entity === entity);
  },
  byStage(stage: ContentStage): ContentItem[] {
    return governance.all().filter((i) => i.stage === stage);
  },
  publishedByEntity(entity: ContentEntity): ContentItem[] {
    return governance.all().filter((i) => i.entity === entity && i.stage === "published");
  },
  reviewQueue(): ContentItem[] {
    return governance.all().filter((i) => i.stage === "moderation_review" || i.stage === "approved");
  },
  get(id: string): ContentItem | undefined {
    return read().find((i) => i.id === id);
  },
  submit(input: {
    entity: ContentEntity;
    data: Record<string, unknown>;
    role: RoleId;
    actorName: string;
    actorEmail?: string;
    saveAsDraft?: boolean;
    scopeTag?: string;
  }): ContentItem {
    const auth = authorityFor(input.entity, input.role);
    const stage: ContentStage = input.saveAsDraft || (!auth.canCreate && auth.canDraft)
      ? "draft"
      : "moderation_review";
    const now = Date.now();
    const item: ContentItem = {
      id: `gov_${now}_${Math.random().toString(36).slice(2, 7)}`,
      entity: input.entity,
      data: input.data,
      stage,
      createdByRole: input.role,
      createdByName: input.actorName,
      createdByEmail: input.actorEmail,
      createdAt: now,
      updatedAt: now,
      scopeTag: input.scopeTag,
      events: [
        {
          at: now,
          by: input.actorName,
          byRole: input.role,
          action: stage === "draft" ? "draft_saved" : "submitted",
        },
      ],
    };
    write([item, ...read()]);
    return item;
  },
  transition(id: string, action: GovernanceEvent["action"], actor: { name: string; role: RoleId }, note?: string) {
    const items = read();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const item = items[idx];
    const stageMap: Record<typeof action, ContentStage | undefined> = {
      submitted: "moderation_review",
      approved: "approved",
      published: "published",
      rejected: "rejected",
      edited: item.stage,
      draft_saved: "draft",
    };
    const next = stageMap[action] ?? item.stage;
    items[idx] = {
      ...item,
      stage: next,
      reviewerNote: action === "approved" || action === "rejected" ? note : item.reviewerNote,
      updatedAt: Date.now(),
      events: [...item.events, { at: Date.now(), by: actor.name, byRole: actor.role, action, note }],
    };
    write(items);
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
};
