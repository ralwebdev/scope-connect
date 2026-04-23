# Core / Auth Module Documentation

## Overview
This module is the backbone of Scope Connect's security. It handles user identity, authentication (login/signup), role-based access control (RBAC), and session management. Since it manages identity, other modules will rely on the Context and Events provided by this module.

## Frontend (`/client`) Responsibilities
The frontend acts as the entry point for users to authenticate.

### Key Components & Screens
1. **Login Page (`/auth/login`)**: Email/Password and/or SSO (OAuth) login forms.
2. **Signup Page (`/auth/signup`)**: Registration form with role selection (Student vs. Institution Admin - though Admin roles may require approval).
3. **Forgot/Reset Password Pages**: Standard password recovery flows.
4. **Auth Provider (`<AuthProvider>`)**:
   - **CRITICAL:** This component wraps the entire Shell Application.
   - It maintains the global React state for the logged-in user (e.g., `user` object, `isAuthenticated` boolean, `role`).
   - Exposes a `useAuth()` hook for other modules to check permissions or get the current user's ID.

### Rules
- Do NOT expose user passwords or sensitive tokens in the Auth Provider state.
- Handle JWT token storage securely (e.g., HTTP-only cookies preferred, or secure local storage).

---

## Backend (`/server`) Responsibilities
The backend manages the secure verification of identity and user data.

### Key Models (Mongoose)
1. **User**: `_id`, `email`, `passwordHash`, `role` (Enum: SUPER_ADMIN, INST_ADMIN, STUDENT), `status` (Active, Suspended).
2. **Session** (Optional): To track active logins or implement refresh tokens.

### Key API Routes (Mounted at `/api/v1/auth`)
- `POST /register`: Creates a new user.
- `POST /login`: Verifies credentials, returns JWT (or sets cookie).
- `POST /logout`: Invalidates session/cookie.
- `GET /me`: Returns the current user's profile data based on JWT.
- `POST /refresh`: Refresh JWT token.

### Inter-Module Communication (Crucial)
This module acts as a primary *producer* of events.

#### Events Emitted (via `shell/server/shared/EventBus`)
- `USER_REGISTERED`: Emitted when a new user signs up. Payload: `{ userId, role, email }`.
  - *Why?* The Builder module needs this to create an empty portfolio. The Institution module might need this to map a student to a campus.
- `USER_DELETED` / `USER_SUSPENDED`: Emitted when an account is deactivated.

#### Shared Middlewares Exposed to Shell
The Auth team must provide a middleware (e.g., `requireAuth`, `requireRole(role)`) that the Shell application places in `shell/server/shared/middlewares`. Other modules will use this to protect their routes.
