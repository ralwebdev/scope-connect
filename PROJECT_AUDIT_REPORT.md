# Project Audit Report — Scope Connect

## 1. Executive Summary
The project is currently a **highly polished frontend prototype** with comprehensive UI coverage but **lacks a functional backend**. All state management is client-side via `localStorage`. The migration to a MERN stack is the primary hurdle to reaching MVP status.

- **Overall project completion percentage**: 45%
- **Frontend completion percentage**: 90%
- **Backend completion percentage**: 0% (currently using mock logic)
- **Database/data-model completion percentage**: 70% (logic defined in frontend stores, but no physical DB)
- **Integration completion percentage**: 5% (routing and layout integrated; API calls missing)
- **Main risk areas**: Role-based security enforcement, daily reporting penalty engine integrity, and consistent cross-device state.

---

## 2. Implementation Plan Coverage
| Planned Feature/Module | Status | Evidence in Repo | Missing Work | Priority |
| :--- | :--- | :--- | :--- | :--- |
| User Auth (JWT) | **Missing** | `auth.tsx` has UI; `scope-store.ts` has fake logic. | Node.js logic, JWT, password hashing. | P0 |
| Role-Based Access | **Partial** | `rbac.ts` defines roles; `use-rbac.ts` enforces in UI. | Server-side enforcement middleware. | P0 |
| Builder Projects | **Complete (UI)** | `projects.tsx`, `execution.tsx` | Permanent DB storage. | P1 |
| Daily Reporting | **Complete (UI)** | `reporting.tsx`, `reporting-store.ts` | Server-side validation, CRON for penalties. | P1 |
| Institutional CRM | **Complete (UI)** | `scope-admin.tsx`, `crm-store.ts` | Secure data isolation for institutions. | P1 |
| Opportunity Hub | **Complete (UI)** | `opportunities-hub.tsx` | Eligibility engine migration to backend. | P2 |
| Global Analytics | **Partial** | `admin.tsx` tracks local events. | Aggregation logic across all users. | P3 |

---

## 3. Feature-by-Feature Audit

### Authentication & Roles
- **What is implemented**: Login/Signup forms, role-aware UI navigation, landing route redirection based on role.
- **What is missing**: Real password verification, session persistence via JWT, email verification.
- **Related files**: `src/routes/auth.tsx`, `src/lib/rbac.ts`, `src/hooks/use-rbac.ts`.
- **Risks**: Currently, any email is accepted and assigned a role based on string matching (e.g., "admin@...").
- **Next steps**: Implement the Auth module in the new Express backend.

### Daily Reporting Portal
- **What is implemented**: Submission dialogs, streak counters, compliance progress bars, reviewer queue UI.
- **What is missing**: Locking submissions to a specific day-key via server time.
- **Related files**: `src/routes/reporting.tsx`, `src/lib/reporting-store.ts`.
- **Risks**: Clients can manipulate `localStorage` or system clock to fix missed reports.
- **Next steps**: Create the Reporting API and Penalty service.

---

## 4. Frontend Audit
- **Pages implemented**: 40+ routes found including Student Dashboard, Admin Console, CRM, and Opportunity Hub.
- **Components not used anywhere**:
    - `src/integrations/supabase/*`: Present but marked for removal.
    - Some generic UI components in `src/components/ui/` might be unused but are part of the standard library.
- **API calls found**: **None.** Currently all "API calls" are synchronous calls to local stores.
- **UI features missing**: Real-time notifications (currently static/seeded), image upload functionality.

---

## 5. Backend Audit
- **Status**: **Non-existent.**
- **Missing CRUD**: Every module (Users, Projects, Institutions, Applications, Reports) needs full CRUD.
- **Middleware issues**: No server-side auth or rate limiting.
- **Error handling**: The frontend has toast notifications, but no standard server error response handler is integrated.

---

## 6. Database and Data Integrity Audit
- **Required relationships**:
    - `User -> Campus` (Many-to-One)
    - `Report -> Assignment` (Many-to-One)
    - `Application -> Opportunity` (Many-to-One)
- **Orphan data risks**: Currently, deleting a campus/institution from `localStorage` in the CRM does not cleanup the "Chapter Leader" or "Faculty" assignments of users.
- **Indexing issues**: N/A (No DB yet).

---

## 7. Orphan Data and Unused Code Report

### Orphan Frontend Files
| Item | Type | Location | Why It Is Orphan | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- |
| Supabase Integration | Folder | `src/integrations/supabase/` | User requested removal. | Delete folder. |
| routeTree.gen.ts | File | `src/routeTree.gen.ts` | Build artifact. | Do not edit; ignore. |

### API Mismatch Issues
| Frontend call | Backend Route | Status | Issue |
| :--- | :--- | :--- | :--- |
| `auth.login()` | `POST /auth/login` | **Missing** | UI logic needs to await response. |
| `feed.create()` | `POST /feed` | **Missing** | Payload needs authorId from session. |

---

## 8. Security and Validation Audit
- **Auth protection**: **Zero.** Front-end `AuthGate` is easily bypassed by setting `scope_logged_in: true` in console.
- **Exposed secrets**: `wrangler.jsonc` might contain deployment IDs; `.env` needs to be secured for backend.
- **Input validation**: Current forms use some local state checks, but no backend-side schema validation (Zod/Joi) is present.

---

## 9. Final Implementation Roadmap

### P0 - Critical Fixes
| Task | Area | Files to Change | Reason | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| Express Setup | Backend | New folder | Foundational requirement. | Medium |
| JWT Auth | Backend | `routes/auth`, `models/User` | Security and session mgmt. | High |

### P1 - Core Migration
| Task | Area | Files to Change | Reason | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| Reporting Engine | Backend | `services/penaltyEngine` | Core business logic. | High |
| CRM Migration | Backend | `models/Institution` | Secure partner data. | Medium |

---

## 10. Final Verdict
- **Current Development Percentage**: 45%
- **Remaining Implementation Percentage**: 55%
- **MVP Ready**: **No.** Needs functional Auth and DB.
- **Production Ready**: **No.**
- **Biggest Blockers**: Lack of persistent backend, absence of server-side security, and complex penalty engine implementation.
