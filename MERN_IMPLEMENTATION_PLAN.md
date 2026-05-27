# MERN Implementation Plan — Scope Connect

## 1. Project Goal
Convert the existing TanStack Start / React frontend into a full MERN stack application (MongoDB, Express, React, Node.js). This involves replacing all `localStorage` state management with a robust REST API and persistent database.

---

## 2. Implementation Roadmap

### Phase 1: Project Setup & Backend Boilerplate
- **Setup**: Create `backend/` directory with Express and TypeScript.
- **Environment**: Configure `.env` for MongoDB URI, JWT Secret, and Port.
- **Boilerplate**: Implement global error handling, logging (Winston/Morgan), and CORS.
- **Scripts**: Update `package.json` to run both frontend and backend concurrently.

### Phase 2: Database Schema Creation (Mongoose)
- **Models**: Implement models defined in `DATABASE_SCHEMA_PLAN.md`.
- **Relationships**: Ensure proper referencing between Users, Institutions, Projects, and Applications.
- **Validation**: Use Mongoose built-in validation and Zod for API request validation.

### Phase 3: Authentication & Role-Based Access Control (RBAC)
- **Identity**: Implement JWT-based auth with `bcrypt` for password hashing.
- **Middleware**: Create `authMiddleware` to verify tokens and `roleMiddleware` to gate endpoints by `RoleId`.
- **Role Logic**: Migrate heuristics from `src/lib/rbac.ts` to the backend.

### Phase 4: Core Module APIs
- **Users**: Profile management, Portfolio updates, XP/Streak logic.
- **Institutions**: CRM pipeline, Provisioning, Member approval.
- **Projects & Feed**: CRUD operations for builder projects and social feed.
- **Opportunities**: Eligibility evaluation engine and application workflow.

### Phase 5: Daily Reporting & Penalty Engine
- **Reports**: Daily submission logic with IST day-key locking.
- **Automation**: Implement a CRON job (or simple interval) to evaluate penalties for missed reports.
- **Recoveries**: Workflow for mentors to approve/reject recovery requests.

### Phase 6: Frontend API Integration
- **Client**: Install Axios and create a central API client with interceptors for JWT.
- **Hooks**: Replace `useStoreValue` calls with TanStack Query (`useQuery`, `useMutation`).
- **State**: Migrate from `localStorage` stores to server-state managed by Query.

### Phase 7: Testing & Security Hardening
- **Validation**: Comprehensive input sanitization to prevent MongoDB injection.
- **Security**: Implement Helmet, HPP, and Express-Rate-Limit.
- **Testing**: Write unit tests for the Penalty Engine and Eligibility Engine.

### Phase 8: Deployment Preparation
- **Build**: Configure Vite build to serve the frontend from the Express static folder or prepare for split hosting.
- **Seeders**: Create a comprehensive seeder to populate the DB with realistic data from `mock-data.ts`.

---

## 3. Backend Folder Structure
```text
backend/
  src/
    config/         # Database connection, environment config
    controllers/    # Request handling logic
    models/         # Mongoose schemas
    routes/         # API route definitions
    middleware/     # Auth, RBAC, Error handling
    services/       # Business logic (XP calc, Penalty engine)
    validators/     # Zod/Joi schemas for request bodies
    utils/          # Helpers (Date keys, slugify)
    seeders/        # Initial data population
    app.ts          # Express app configuration
    server.ts       # Entry point
  .env
  package.json
  tsconfig.json
```

---

## 4. Key Implementation Risks
1. **XP/Streak Logic**: Calculating streaks and daily penalties requires consistent server-time handling (IST).
2. **TanStack Start Integration**: The current frontend uses TanStack Start, which has its own server-side capabilities. We must decide whether to use Express as a separate process or leverage TanStack Start's Server Functions. *Decision: To follow MERN requirements, use Express for the API.*
3. **Data Migration**: Existing users have data in `localStorage`. A "hydration" strategy might be needed if we want to preserve demo data, or a complete reset for production.
4. **Complexity of Roles**: With 13 roles, ensuring the `roleMiddleware` is applied correctly to every route is critical.
