// Internal CRM store for Scope Admin + Super Admin portals.
// Pure localStorage; emits scope:store-change so use-scope hooks re-render.

export type PipelineStage =
  | "Prospect"
  | "Contacted"
  | "Meeting Scheduled"
  | "Meeting Completed"
  | "Proposal Sent"
  | "Negotiation"
  | "MoU Draft Shared"
  | "MoU Signed"
  | "Launch Pending"
  | "Live Chapter"
  | "Dormant";

export const PIPELINE_STAGES: PipelineStage[] = [
  "Prospect", "Contacted", "Meeting Scheduled", "Meeting Completed",
  "Proposal Sent", "Negotiation", "MoU Draft Shared", "MoU Signed",
  "Launch Pending", "Live Chapter", "Dormant",
];

export type Institution = {
  id: string;
  name: string;
  type: "University" | "Engineering College" | "School" | "Polytechnic" | "Other";
  board?: string;
  city: string;
  state: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  ownerId: string; // admin id
  priority: 1 | 2 | 3 | 4 | 5;
  potentialValue: number; // INR
  stage: PipelineStage;
  notes: string;
  updatedAt: number;
};

export type Visit = {
  id: string;
  institutionId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  ownerId: string;
  status: "scheduled" | "checked_in" | "completed" | "cancelled";
  notes?: string;
};

export type LaunchChecklist = {
  institutionId: string;
  facultyAssigned: boolean;
  leaderShortlisted: boolean;
  launchScheduled: boolean;
  registrationsStarted: boolean;
  pageLive: boolean;
  challengeActivated: boolean;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  region: string;
  focus: string;
  meetings: number;
  closures: number;
  lastActive: number;
  status: "active" | "suspended";
  target: number;
};

// ─── Lifecycle additions (additive — does not change PipelineStage flow) ───
export type InstitutionCredential = {
  institutionId: string;
  email: string;
  tempPassword: string;
  generatedAt: number;
  generatedBy: string;       // actor email
  generatedByRole: string;   // RoleId
  passwordResetAt?: number;  // first-login reset timestamp
  termsAcceptedAt?: number;
  profileCompletedAt?: number;
};

export type AuditEntry = {
  id: string;
  at: number;
  actorEmail: string;
  actorRole: string;
  action:
    | "credential_generated"
    | "credential_revoked"
    | "first_login_password_reset"
    | "terms_accepted"
    | "profile_completed"
    | "student_approved"
    | "student_rejected"
    | "faculty_invited"
    | "campus_leader_invited";
  targetType: "institution" | "member" | "student";
  targetId: string;
  meta?: Record<string, string | number | boolean>;
};

const KEY = "sc_crm_v1";

type CrmData = {
  institutions: Institution[];
  visits: Visit[];
  launches: Record<string, LaunchChecklist>;
  admins: AdminProfile[];
  credentials?: Record<string, InstitutionCredential>;
  audit?: AuditEntry[];
};

function notify() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("scope:store-change", { detail: { keys: [KEY] } }));
  } catch { /* noop */ }
}

function seed(): CrmData {
  const now = Date.now();
  return {
    admins: [
      { id: "a1", name: "Aniket Roy", email: "aniket.scope-admin@scope.in", region: "Kolkata", focus: "Engineering Colleges", meetings: 18, closures: 4, lastActive: now - 36e5, status: "active", target: 6 },
      { id: "a2", name: "Priya Sen", email: "priya.scope-admin@scope.in", region: "West Bengal Schools", focus: "CBSE Schools", meetings: 26, closures: 7, lastActive: now - 3 * 36e5, status: "active", target: 8 },
      { id: "a3", name: "Rahul Das", email: "rahul.scope-admin@scope.in", region: "Durgapur", focus: "Polytechnics", meetings: 11, closures: 2, lastActive: now - 26 * 36e5, status: "active", target: 5 },
    ],
    institutions: [
      { id: "i1", name: "ABC University", type: "University", board: "UGC", city: "Kolkata", state: "West Bengal", contactPerson: "Dr. S. Mehta", designation: "Dean Student Affairs", phone: "+91 98300 11122", email: "dean@abcu.edu.in", ownerId: "a1", priority: 5, potentialValue: 250000, stage: "Negotiation", notes: "Interested in flagship chapter Q1.", updatedAt: now },
      { id: "i2", name: "XYZ College of Engineering", type: "Engineering College", board: "AICTE", city: "Durgapur", state: "West Bengal", contactPerson: "Prof. R. Kapoor", designation: "Principal", phone: "+91 98311 44455", email: "principal@xyzce.in", ownerId: "a3", priority: 4, potentialValue: 180000, stage: "MoU Signed", notes: "Awaiting launch date.", updatedAt: now },
      { id: "i3", name: "Heritage Public School", type: "School", board: "CBSE", city: "Kolkata", state: "West Bengal", contactPerson: "Ms. N. Bose", designation: "Principal", phone: "+91 98302 77788", email: "office@heritageps.in", ownerId: "a2", priority: 3, potentialValue: 90000, stage: "Proposal Sent", notes: "Sent pricing deck v2.", updatedAt: now },
      { id: "i4", name: "Eastern Institute of Tech", type: "Engineering College", board: "AICTE", city: "Kolkata", state: "West Bengal", contactPerson: "Dr. K. Iyer", designation: "Director", phone: "+91 98304 22233", email: "director@eit.ac.in", ownerId: "a1", priority: 4, potentialValue: 200000, stage: "Live Chapter", notes: "Chapter live since Sep.", updatedAt: now },
      { id: "i5", name: "Shree Vidya Bhavan", type: "School", board: "ICSE", city: "Howrah", state: "West Bengal", contactPerson: "Mr. A. Ganguly", designation: "Vice Principal", phone: "+91 98305 88899", email: "vp@shreevidya.in", ownerId: "a2", priority: 2, potentialValue: 60000, stage: "Contacted", notes: "Initial call done.", updatedAt: now },
      { id: "i6", name: "Bengal Polytechnic", type: "Polytechnic", board: "WBSCTE", city: "Asansol", state: "West Bengal", contactPerson: "Mr. T. Saha", designation: "Coordinator", phone: "+91 98307 99900", email: "coord@bp.edu.in", ownerId: "a3", priority: 2, potentialValue: 70000, stage: "Prospect", notes: "Cold outreach pending.", updatedAt: now },
      { id: "i7", name: "Royal CBSE Academy", type: "School", board: "CBSE", city: "Siliguri", state: "West Bengal", contactPerson: "Ms. P. Roy", designation: "Principal", phone: "+91 98309 11200", email: "p@royalcbse.in", ownerId: "a2", priority: 4, potentialValue: 110000, stage: "MoU Draft Shared", notes: "Legal review.", updatedAt: now },
      { id: "i8", name: "Tech Valley Institute", type: "Engineering College", board: "AICTE", city: "Bhubaneswar", state: "Odisha", contactPerson: "Dr. M. Patro", designation: "Dean", phone: "+91 98432 22211", email: "dean@tvi.ac.in", ownerId: "a1", priority: 3, potentialValue: 160000, stage: "Meeting Completed", notes: "Decision in 2 weeks.", updatedAt: now },
    ],
    visits: [
      { id: "v1", institutionId: "i1", date: new Date().toISOString().slice(0,10), time: "11:00", ownerId: "a1", status: "scheduled" },
      { id: "v2", institutionId: "i3", date: new Date().toISOString().slice(0,10), time: "15:30", ownerId: "a2", status: "scheduled" },
      { id: "v3", institutionId: "i6", date: new Date(Date.now() + 864e5).toISOString().slice(0,10), time: "10:00", ownerId: "a3", status: "scheduled" },
    ],
    launches: {
      i2: { institutionId: "i2", facultyAssigned: true, leaderShortlisted: true, launchScheduled: true, registrationsStarted: false, pageLive: false, challengeActivated: false },
      i4: { institutionId: "i4", facultyAssigned: true, leaderShortlisted: true, launchScheduled: true, registrationsStarted: true, pageLive: true, challengeActivated: true },
    },
  };
}

function read(): CrmData {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as CrmData;
  } catch { return seed(); }
}

function write(d: CrmData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    notify();
  } catch { /* noop */ }
}

export const crm = {
  KEY,
  all(): CrmData { return read(); },
  institutions(): Institution[] { return read().institutions; },
  visits(): Visit[] { return read().visits; },
  admins(): AdminProfile[] { return read().admins; },
  launch(id: string): LaunchChecklist {
    const d = read();
    return d.launches[id] ?? { institutionId: id, facultyAssigned: false, leaderShortlisted: false, launchScheduled: false, registrationsStarted: false, pageLive: false, challengeActivated: false };
  },
  upsertInstitution(inst: Institution) {
    const d = read();
    const idx = d.institutions.findIndex((i) => i.id === inst.id);
    if (idx >= 0) d.institutions[idx] = { ...inst, updatedAt: Date.now() };
    else d.institutions.unshift({ ...inst, updatedAt: Date.now() });
    write(d);
  },
  moveStage(id: string, stage: PipelineStage) {
    const d = read();
    const i = d.institutions.find((x) => x.id === id);
    if (!i) return;
    i.stage = stage;
    i.updatedAt = Date.now();
    write(d);
  },
  addNote(id: string, note: string) {
    const d = read();
    const i = d.institutions.find((x) => x.id === id);
    if (!i) return;
    i.notes = note ? `${note}\n${i.notes ?? ""}`.trim() : i.notes;
    i.updatedAt = Date.now();
    write(d);
  },
  scheduleVisit(v: Omit<Visit, "id" | "status">) {
    const d = read();
    d.visits.unshift({ ...v, id: `v${Date.now()}`, status: "scheduled" });
    write(d);
  },
  setVisitStatus(id: string, status: Visit["status"], notes?: string) {
    const d = read();
    const v = d.visits.find((x) => x.id === id);
    if (!v) return;
    v.status = status;
    if (notes !== undefined) v.notes = notes;
    write(d);
  },
  toggleLaunchStep(id: string, key: keyof Omit<LaunchChecklist, "institutionId">) {
    const d = read();
    const cur = d.launches[id] ?? { institutionId: id, facultyAssigned: false, leaderShortlisted: false, launchScheduled: false, registrationsStarted: false, pageLive: false, challengeActivated: false };
    cur[key] = !cur[key];
    d.launches[id] = cur;
    write(d);
  },
  upsertAdmin(a: AdminProfile) {
    const d = read();
    const idx = d.admins.findIndex((x) => x.id === a.id);
    if (idx >= 0) d.admins[idx] = a;
    else d.admins.unshift(a);
    write(d);
  },
  setAdminStatus(id: string, status: AdminProfile["status"]) {
    const d = read();
    const a = d.admins.find((x) => x.id === id);
    if (!a) return;
    a.status = status;
    write(d);
  },
  reset() { if (typeof window !== "undefined") { localStorage.removeItem(KEY); notify(); } },

  // ─── Credentials ──────────────────────────────────────────
  credential(institutionId: string): InstitutionCredential | null {
    return read().credentials?.[institutionId] ?? null;
  },
  generateCredential(args: {
    institutionId: string;
    email: string;
    actorEmail: string;
    actorRole: string;
  }): InstitutionCredential {
    const d = read();
    const inst = d.institutions.find(i => i.id === args.institutionId);
    if (!inst) throw new Error("Institution not found");
    if (inst.stage !== "Launch Pending") {
      throw new Error("Credentials can only be generated at Launch Pending stage.");
    }
    if (!["scope_admin", "scope_super_admin", "super_admin"].includes(args.actorRole)) {
      throw new Error("Only Scope Admin or Super Admin can generate credentials.");
    }
    d.credentials = d.credentials ?? {};
    if (d.credentials[args.institutionId]) {
      throw new Error("An institutional admin credential already exists. Only one initial admin is allowed.");
    }
    const tempPassword = `Scope@${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`;
    const cred: InstitutionCredential = {
      institutionId: args.institutionId,
      email: args.email.toLowerCase(),
      tempPassword,
      generatedAt: Date.now(),
      generatedBy: args.actorEmail,
      generatedByRole: args.actorRole,
    };
    d.credentials[args.institutionId] = cred;
    d.audit = d.audit ?? [];
    d.audit.unshift({
      id: `au_${Date.now()}`, at: Date.now(),
      actorEmail: args.actorEmail, actorRole: args.actorRole,
      action: "credential_generated", targetType: "institution", targetId: args.institutionId,
      meta: { email: cred.email, institution: inst.name },
    });
    write(d);
    return cred;
  },
  markFirstLoginStep(
    institutionId: string,
    step: "passwordResetAt" | "termsAcceptedAt" | "profileCompletedAt",
    actorEmail: string,
  ) {
    const d = read();
    if (!d.credentials?.[institutionId]) return;
    d.credentials[institutionId][step] = Date.now();
    d.audit = d.audit ?? [];
    const map = {
      passwordResetAt: "first_login_password_reset",
      termsAcceptedAt: "terms_accepted",
      profileCompletedAt: "profile_completed",
    } as const;
    d.audit.unshift({
      id: `au_${Date.now()}`, at: Date.now(),
      actorEmail, actorRole: "institutional_admin",
      action: map[step], targetType: "institution", targetId: institutionId,
    });
    write(d);
  },

  // ─── Audit ────────────────────────────────────────────────
  audit(): AuditEntry[] { return read().audit ?? []; },
  logAudit(entry: Omit<AuditEntry, "id" | "at">) {
    const d = read();
    d.audit = d.audit ?? [];
    d.audit.unshift({ ...entry, id: `au_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, at: Date.now() });
    if (d.audit.length > 500) d.audit = d.audit.slice(0, 500);
    write(d);
  },
};

/**
 * Stage → system flag mapping. Layered on top of the existing PipelineStage
 * flow without modifying it. Used by guards to gate credential generation,
 * login access, full module access, and dormant restrictions.
 */
export type StageAccess = {
  loginAccess: "none" | "institutional_admin_only" | "full";
  credentialGeneration: boolean;
  fullModuleAccess: boolean;
  restricted: boolean;
  description: string;
};

export function stageAccess(stage: PipelineStage): StageAccess {
  switch (stage) {
    case "MoU Signed":
      return { loginAccess: "none", credentialGeneration: false, fullModuleAccess: false, restricted: false,
        description: "Contractually onboarded. Platform access locked until launch." };
    case "Launch Pending":
      return { loginAccess: "institutional_admin_only", credentialGeneration: true, fullModuleAccess: false, restricted: false,
        description: "Activation stage. Generate institutional admin credentials." };
    case "Live Chapter":
      return { loginAccess: "full", credentialGeneration: false, fullModuleAccess: true, restricted: false,
        description: "Fully operational. All modules enabled." };
    case "Dormant":
      return { loginAccess: "full", credentialGeneration: false, fullModuleAccess: false, restricted: true,
        description: "Inactive. Read-only access; new approvals disabled." };
    default:
      return { loginAccess: "none", credentialGeneration: false, fullModuleAccess: false, restricted: false,
        description: "Pre-MoU stage. No platform provisioning." };
  }
}
