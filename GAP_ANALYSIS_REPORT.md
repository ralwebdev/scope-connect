# Gap Analysis Report — Scope Connect

## 1. Frontend vs. Backend Status

| Feature Area | Frontend Status | Backend Status (Proposed) | Gap / Risk |
| :--- | :--- | :--- | :--- |
| **Authentication** | UI Complete (Login/Signup) | Missing | Current auth is "fake" (auto-login for any email). Critical priority. |
| **RBAC** | UI Logic Complete | Missing | Roles are derived from email strings. Needs server-side enforcement. |
| **Builder Projects** | UI Complete (CRUD) | Missing | Data is lost on browser clear. |
| **Daily Reporting** | UI Complete | Missing | Penalty logic is complex and relies on system clock. Needs server-side CRON. |
| **CRM Pipeline** | UI Complete | Missing | Currently a client-side CRM. Needs secure institution data. |
| **Opportunity Hub** | UI Complete | Missing | Eligibility logic should be server-side for integrity. |
| **Leaderboards** | UI Complete | Missing | Needs database aggregation for accurate ranking. |

---

## 2. Incomplete Workflows / Risks

### 2.1 Password Management
- **Issue**: The current "Institution Admin" provisioning flow generates a temporary password in `crm-store.ts`.
- **Gap**: There is no backend "Change Password" or "Email Dispatcher" to actually send these credentials to the user.

### 2.2 Date/Time Consistency
- **Issue**: Reporting and Streaks depend on "Today's Date".
- **Risk**: Users could manipulate their system clock to bypass late report penalties or maintain streaks.
- **Fix**: All date-key generation (`YYYY-MM-DD`) must happen on the server using IST.

### 2.3 Image/Media Storage
- **Issue**: The UI has "Image Upload coming soon" placeholders (e.g., in `feed.tsx`).
- **Gap**: No design exists for where these files are stored (S3, Cloudinary, or MongoDB GridFS).

### 2.4 Real-time Notifications
- **Issue**: The notification bell is seeded with mock data.
- **Gap**: No "Push" mechanism exists. Notifications are currently "Pull" only (refreshed on page load).

---

## 3. Orphan Data Risks
- **Institution References**: Users are "mapped" to institutions based on email handles in the demo. In production, a user document must have a hard `institutionId`.
- **Project Owners**: Many projects in mock data are "authorless" or assigned to seed IDs.

---

## 4. Implementation Risks (Technical)
1. **TanStack Start vs Express**: The project is a TanStack Start app. Adding a separate Express backend might create deployment complexity (2 services vs 1). However, to satisfy "MERN" requirements, a separate Node/Express backend is the standard path.
2. **MongoDB Consistency**: Since the app uses many related entities (Assignments -> Reports -> Penalties), Mongoose transactions or careful cascade-logic will be required to prevent data drift.
3. **Removing Supabase**: There are several files (`src/integrations/supabase/*`) that must be carefully unlinked to avoid build errors.
