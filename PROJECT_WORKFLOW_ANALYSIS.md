# Project Workflow Analysis — Scope Connect

## 1. Overview
Scope Connect is a curated campus innovation network designed to connect student builders with real-world opportunities, hackathons, and leadership roles across India. The platform transition from a mock-data/localStorage-based frontend to a full MERN stack requires mapping complex workflows across multiple user roles.

## 2. User Roles & Access Levels
The platform identifies 13 distinct roles, primarily categorized into three tiers:

### Tier 1: Public & Students (Builders)
- **Viewer / Guest**: Unauthenticated user; limited view of landing page and public projects.
- **Student / Builder**: The core user. Ships projects, earns XP, maintains a portfolio, applies to opportunities, and participates in daily reporting.

### Tier 2: Campus & Institutional Management
- **Campus Leader**: Manages a specific campus chapter, approves members, and runs local events.
- **Faculty Coordinator**: Supervised student verifications and project approvals within an institution.
- **Institutional Admin**: High-level management for an entire university/college system. Manages members, analytics, and internal communications.

### Tier 3: Scope Platform Operations
- **Scope Admin / Regional Admin**: Manages territories, MoUs with institutions, and regional growth.
- **Content / Growth / Support Admin**: Specialized roles for moderation, marketing, and helpdesk.
- **Super Admin / Scope Super Admin**: Full system access, including RBAC audits, global analytics, and feature configuration.

---

## 3. Core Workflows & User Journeys

### 3.1 Authentication & Onboarding
- **Signup**: Student enters name, email, campus, and interests.
- **Role Assignment**: Currently derived from email patterns (e.g., `*@scope.in` for admins). In MERN, this will be explicitly stored in the User document.
- **Welcome Experience**: New users receive a "Welcome Bonus" (+120 XP) and initial national ranking.

### 3.2 The Builder Journey (Student)
1. **Shipping Projects**: Users create project entries (Title, Category, Problem, Team).
2. **Earning XP**: XP is awarded for posting to the feed (+25), launching projects (+50), and RSVPing to events (+30).
3. **Daily Reporting**: Mandatory accountability for assigned projects. Users must submit a daily update to maintain their "Trust Score" and "Streak".
4. **Portfolio Building**: A dynamic, domain-aware portfolio (Engineering, Design, Research, etc.) that aggregates "Proof of Work".

### 3.3 Opportunity & Application Engine
1. **Discovery**: Users browse the "Opportunities Hub" (Internships, Research, Leadership).
2. **Eligibility Check**: System automatically checks if a user meets thresholds (Reliability Score, XP Level, Projects Completed).
3. **Application**: Eligible users submit a "Statement of Interest" and portfolio links.
4. **Review**: Institutional Admins or Faculty review applications and move them through statuses (Under Review -> Shortlisted -> Selected).

### 3.4 Institutional CRM & Onboarding
1. **Prospecting**: Scope Admins manage a pipeline of institutions (Prospect -> Proposal -> MoU Signed).
2. **Provisioning**: Once an MoU is signed, Scope Admins generate "Institutional Admin" credentials.
3. **Activation**: Institutional Admins log in, reset temporary passwords, and complete the "Institution Profile".
4. **Member Management**: Admins approve or reject student join requests based on verification.

### 3.5 Daily Reporting & Penalty Engine
1. **Assignment**: A student is assigned to a project/internship.
2. **Daily Check-in**: Student logs what they did today.
3. **Escalation**: Missing 1 day triggers a warning; 2 days deducts Trust Score; 3+ days flags the project for mentor review.
4. **Recovery**: Students can submit a "Recovery Request" explaining missed days, which a mentor must approve.

---

## 4. Data Flow (Frontend to Backend)

### Current (LocalStorage)
- Components call methods in `scope-store.ts`, `reporting-store.ts`, or `opportunity-engine-store.ts`.
- Data is serialized to JSON and saved in `localStorage`.
- `window.dispatchEvent` triggers re-renders in hooks.

### Future (MERN)
- **Frontend**: Components call API services (Axios/Fetch).
- **Backend (Express)**:
    - Middleware validates JWT and checks RBAC permissions.
    - Controllers process business logic (e.g., calculating XP, checking eligibility).
    - Mongoose interacts with **MongoDB**.
- **Real-time**: Streak updates and notifications are handled via scheduled tasks or server-side triggers.

---

## 5. Disconnected / Orphan Components
- **Supabase Integration**: Files in `src/integrations/supabase/` are present but currently ignored/to be removed in favor of the MERN backend.
- **Wrangler/Cloudflare Config**: `wrangler.jsonc` suggests a worker-based deployment which might conflict with a standard Node.js backend unless using Hono/Cloudflare Workers for the backend.
- **Mock Seed Data**: Extensive mock data in `mock-data.ts` and various stores needs to be migrated to a database seeder.
