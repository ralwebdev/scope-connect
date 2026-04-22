// Scope Connect — Role-Based Access Control engine.
// No backend: roles are derived from the signed-in user's email pattern,
// with an optional override stored in localStorage (set by /admin/config).
//
// Permission keys are flat strings. "*" grants everything.

export type RoleId =
  | "super_admin"
  | "scope_super_admin"
  | "scope_admin"
  | "regional_admin"
  | "campus_admin"
  | "content_admin"
  | "growth_admin"
  | "support_admin"
  | "viewer";

export type PermissionKey =
  | "view_dashboard"
  | "view_admin"
  | "edit_brand"
  | "edit_contact"
  | "manage_features"
  | "manage_campuses"
  | "manage_projects"
  | "manage_events"
  | "manage_feed"
  | "view_analytics"
  | "export_config"
  | "import_config"
  | "manage_users"
  | "manage_support";

export const ALL_ROLES: RoleId[] = [
  "super_admin",
  "scope_super_admin",
  "scope_admin",
  "regional_admin",
  "campus_admin",
  "content_admin",
  "growth_admin",
  "support_admin",
  "viewer",
];

export const ALL_PERMISSIONS: PermissionKey[] = [
  "view_dashboard",
  "view_admin",
  "edit_brand",
  "edit_contact",
  "manage_features",
  "manage_campuses",
  "manage_projects",
  "manage_events",
  "manage_feed",
  "view_analytics",
  "export_config",
  "import_config",
  "manage_users",
  "manage_support",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleId, PermissionKey[] | ["*"]> = {
  super_admin: ["*"],
  regional_admin: [
    "view_dashboard",
    "view_admin",
    "manage_campuses",
    "view_analytics",
    "manage_events",
    "export_config",
  ],
  campus_admin: ["view_dashboard", "manage_campuses", "manage_feed"],
  content_admin: ["view_dashboard", "manage_projects", "manage_feed"],
  growth_admin: ["view_dashboard", "view_analytics", "manage_events"],
  support_admin: ["view_dashboard", "manage_support"],
  viewer: ["view_dashboard"],
};

const RBAC_OVERRIDE_KEY = "sc_permissions";
const ROLE_OVERRIDE_KEY = "sc_role_override";

type PermissionMap = Record<RoleId, PermissionKey[] | ["*"]>;

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

/** Resolve role from email pattern. Demo-grade: deterministic + obvious. */
export function roleFromEmail(email: string | undefined | null): RoleId {
  if (!email) return "viewer";
  const e = email.toLowerCase();
  // Manual override beats heuristics.
  const override = safeRead<Record<string, RoleId>>(ROLE_OVERRIDE_KEY, {});
  if (override[e]) return override[e];

  if (e.includes("super") || e.endsWith("@scope.in") && e.startsWith("founder")) return "super_admin";
  if (e.includes("admin")) return "super_admin";
  if (e.includes("regional")) return "regional_admin";
  if (e.includes("campus")) return "campus_admin";
  if (e.includes("content") || e.includes("editor")) return "content_admin";
  if (e.includes("growth") || e.includes("marketing")) return "growth_admin";
  if (e.includes("support") || e.includes("help")) return "support_admin";
  return "viewer";
}

export const rbac = {
  permissions(): PermissionMap {
    return safeRead<PermissionMap>(RBAC_OVERRIDE_KEY, DEFAULT_ROLE_PERMISSIONS);
  },
  setPermissions(map: PermissionMap) {
    safeWrite(RBAC_OVERRIDE_KEY, map);
    bump();
  },
  resetPermissions() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(RBAC_OVERRIDE_KEY);
    } catch {
      /* noop */
    }
    bump();
  },
  roleOverrides(): Record<string, RoleId> {
    return safeRead<Record<string, RoleId>>(ROLE_OVERRIDE_KEY, {});
  },
  setRoleOverride(email: string, role: RoleId) {
    const map = rbac.roleOverrides();
    map[email.toLowerCase()] = role;
    safeWrite(ROLE_OVERRIDE_KEY, map);
    bump();
  },
  clearRoleOverride(email: string) {
    const map = rbac.roleOverrides();
    delete map[email.toLowerCase()];
    safeWrite(ROLE_OVERRIDE_KEY, map);
    bump();
  },
  hasPermission(role: RoleId, permission: PermissionKey): boolean {
    const map = rbac.permissions();
    const perms = map[role] ?? [];
    if ((perms as string[]).includes("*")) return true;
    return (perms as string[]).includes(permission);
  },
  permissionsFor(role: RoleId): PermissionKey[] {
    const map = rbac.permissions();
    const perms = map[role] ?? [];
    if ((perms as string[]).includes("*")) return ALL_PERMISSIONS;
    return perms as PermissionKey[];
  },
};

function bump() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { keys: [RBAC_OVERRIDE_KEY, ROLE_OVERRIDE_KEY] } }));
  } catch {
    /* noop */
  }
}
