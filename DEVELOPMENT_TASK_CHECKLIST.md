# Development Task Checklist — MERN Migration

## Phase 1: Backend Setup
- [ ] Initialize `backend/` folder with `npm init` and TypeScript.
- [ ] Install dependencies: `express`, `mongoose`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`, `zod`.
- [ ] Create `server.ts` and `app.ts`.
- [ ] Setup MongoDB connection in `config/db.ts`.
- [ ] Implement global error handling middleware.

## Phase 2: User & Auth
- [ ] Create `User` model with roles and XP/Streak fields.
- [ ] Implement `POST /api/auth/signup`.
- [ ] Implement `POST /api/auth/login` (return JWT).
- [ ] Implement `GET /api/auth/me` with JWT verification middleware.
- [ ] Create `roleMiddleware.ts` to gate routes.

## Phase 3: Core Builder Features
- [ ] Create `Project` model.
- [ ] Implement `GET /api/projects` and `POST /api/projects`.
- [ ] Implement `GET /api/feed` and `POST /api/feed`.
- [ ] Add `XP Service` to handle point allocation for specific actions.

## Phase 4: Institutional Admin & CRM
- [ ] Create `Institution` model.
- [ ] Implement CRM endpoints for Scope Admins (`/api/crm/*`).
- [ ] Implement credential generation for Institutional Admins.
- [ ] Implement Member Approval workflow (`PATCH /api/institutions/:id/members/:userId`).

## Phase 5: Opportunity Hub
- [ ] Create `Opportunity` and `Application` models.
- [ ] Implement eligibility logic in `OpportunityService`.
- [ ] Implement `POST /api/opportunities/:id/apply`.
- [ ] Implement status update workflow for admins.

## Phase 6: Daily Reporting
- [ ] Create `ReportAssignment` and `DailyReport` models.
- [ ] Implement `POST /api/reports` with server-side date validation.
- [ ] Implement penalty check logic (CRON or middleware).
- [ ] Create endpoints for Recovery Requests.

## Phase 7: Frontend Integration
- [ ] Setup Axios client in `src/lib/api-client.ts`.
- [ ] Replace Auth UI logic with backend calls.
- [ ] Migrate `Dashboard.tsx` to use TanStack Query hooks.
- [ ] Migrate `Feed.tsx` and `Projects.tsx`.
- [ ] Connect `Reporting.tsx` assignments and submissions.
- [ ] Connect `Admin.tsx` metrics to real aggregated data.

## Phase 8: Final Cleanup
- [ ] Remove `src/integrations/supabase`.
- [ ] Remove mock data files and old stores.
- [ ] Conduct RBAC security audit on all endpoints.
- [ ] Prepare final production build.
