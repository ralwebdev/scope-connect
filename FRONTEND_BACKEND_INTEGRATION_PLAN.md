# Frontend-Backend Integration Plan — Scope Connect

## 1. Overview
The frontend must be transitioned from using synchronous `localStorage` stores (`scope-store.ts`, etc.) to an asynchronous, server-state model using TanStack Query.

---

## 2. Structural Changes

### 2.1 API Client (Axios)
Create `src/lib/api-client.ts`:
- Configure base URL from `.env`.
- Add an interceptor to attach the JWT from `sessionStorage` or a cookie.
- Add an interceptor to handle 401 (Unauthorized) errors by redirecting to `/auth`.

### 2.2 Server State Management (TanStack Query)
Instead of importing objects from `scope-store.ts`, create custom hooks in `src/hooks/api/`:
- `useProjects()`: Fetches projects via `GET /api/projects`.
- `useSubmitReport()`: Mutation for `POST /api/reports`.
- `useUserProfiles(id)`: Fetches user details.

### 2.3 Authentication Context
Update `src/hooks/use-session.ts` and `use-rbac.ts`:
- Replace email-heuristics with actual role data returned from the backend `/api/auth/me` endpoint.
- Store the JWT securely.

---

## 3. Component Migration Strategy

### 3.1 Data Fetching
**Before**:
```tsx
const posts = useStoreValue(() => feed.all());
```
**After**:
```tsx
const { data: posts, isLoading } = useQuery({
  queryKey: ['feed'],
  queryFn: fetchFeed
});
```

### 3.2 Form Submissions
**Before**:
```tsx
const submit = () => {
  feed.create(draft);
  toast.success("Posted");
};
```
**After**:
```tsx
const mutation = useMutation({
  mutationFn: (newPost) => apiClient.post('/feed', newPost),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    toast.success("Posted");
  }
});
```

---

## 4. Specific Integration Points

### 4.1 Daily Reporting (`src/routes/reporting.tsx`)
- The "Submit Today" button must lock based on server-time, not client-time.
- Penalties should be calculated on the server and fetched as a read-only list.

### 4.2 Opportunity Hub (`src/routes/opportunities-hub.tsx`)
- The eligibility check (`evaluateOpportunityEligibility`) should move to the backend.
- The frontend should call `GET /api/opportunities/:id/eligibility` to show/hide the "Apply" button.

### 4.3 Admin Console (`src/routes/admin.tsx`)
- The Admin PIN (`scope2026`) must be replaced with proper backend-verified sessions.
- All stats in the "Today's Pulse" section should be fetched from an aggregated `/api/analytics/global` endpoint.

---

## 5. Suggested Folder Structure
```text
src/
  api/              # Pure API call functions
    auth.ts
    projects.ts
    reporting.ts
  hooks/
    api/            # TanStack Query wrappers
      use-feed.ts
      use-projects.ts
    use-rbac.ts     # Updated to use backend roles
```

---

## 6. Cleanup Task
Once all integrations are verified, delete the following files to prevent "Dead Code" confusion:
- `src/lib/mock-data.ts`
- `src/lib/scope-store.ts`
- `src/lib/reporting-store.ts`
- `src/lib/opportunity-engine-store.ts`
- `src/lib/crm-store.ts`
- `src/integrations/supabase/` (as per requirement to remove Supabase)
