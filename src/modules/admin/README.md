# Super Admin CRM Module Documentation

## Overview
This module is strictly for the internal team running "Scope Connect". It provides a global view of all 140+ campuses, 12,000+ members, platform health, and system-wide configurations.

## Frontend (`/client`) Responsibilities
The frontend is a protected dashboard accessible *only* by users with the `SUPER_ADMIN` role.

### Key Components & Screens
1. **Global Dashboard (`/admin/dashboard`)**: High-level metrics (total active students, total events this week, top-performing campuses).
2. **Institution Management (`/admin/institutions`)**:
   - A data table listing all registered campuses.
   - UI to approve/reject new campus registrations.
   - Ability to suspend or deactivate a campus.
3. **User Management (`/admin/users`)**:
   - Global directory of all users across the platform.
   - Tools to reset passwords manually, change roles, or ban malicious users.
4. **Platform Settings (`/admin/settings`)**: Global toggles (e.g., "maintenance mode", global feature flags).

### Rules
- Wrap the main entry point router with a `RequireRole(SUPER_ADMIN)` guard utilizing the `useAuth()` hook provided by the Auth module.
- Use charting libraries (e.g., Recharts, Chart.js) for analytics, but keep them contained within this module.

---

## Backend (`/server`) Responsibilities
The backend aggregates data and performs highly privileged actions.

### Key Models (Mongoose)
1. **PlatformSettings**: Singleton or key-value store for global platform configs.
2. **GlobalAnalyticsCache** (Optional): A collection to store pre-calculated daily/weekly stats if querying the raw data becomes too slow.
3. **AuditLog**: To track actions taken by Super Admins for security compliance.

### Key API Routes (Mounted at `/api/v1/admin`)
*(All routes must be protected by the `requireRole('SUPER_ADMIN')` middleware)*
- `GET /stats/overview`: Returns aggregated counts of users, institutions, etc.
- `GET /institutions`: List all institutions (with pagination/filtering).
- `PUT /institutions/:id/status`: Approve/Reject an institution.
- `PUT /users/:id/role`: Escalate a user to admin or demote them.
- `GET /audit-logs`: View system audit logs.

### Inter-Module Communication

#### Data Fetching (Synchronous via Interfaces)
Because the Admin CRM needs to aggregate data from everywhere, it will heavily rely on the `interface.js` exposed by other modules.
- **Example**: To get the total number of projects built, the Admin controller calls `builderInterface.getTotalProjectCount()`.
- **Example**: To list all campuses, it calls `institutionInterface.getAllCampuses()`.
*Note: Do not duplicate Institution or Builder models here. Ask their modules for the data.*

#### Events Listened To
- `USER_REGISTERED`, `EVENT_CREATED`, `PROJECT_SUBMITTED`: Listen to these via the EventBus to update the `GlobalAnalyticsCache` in real-time or simply to write to the `AuditLog`.

#### Events Emitted
- `INSTITUTION_APPROVED`: Emitted when an admin approves a new campus. (The Institution module listens to this to activate the campus).
- `USER_BANNED`: Emitted when an admin bans a user. (Auth listens to invalidate their session; Builder listens to hide their portfolio).
