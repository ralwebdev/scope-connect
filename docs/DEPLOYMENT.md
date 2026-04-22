# Scope Connect — Plug-and-Play Deployment SOP

One engine, many deployments. Change config → ship a new edition.

## TL;DR

All white-label settings live in **`src/lib/platform-config.ts`**.
Edit one file, redeploy. No component changes required.

## Launch a new edition (under 30 minutes)

1. Open `src/lib/platform-config.ts`.
2. Pick an edition pack on the `EDITION` line:
   - `scope-india` — full Scope flagship (default)
   - `campus-pro` — single-campus deployment, no ads/recruiter
   - `university-network` — multi-campus, no ads
   - `corporate-challenge` — challenges only, no public feed/ambassadors
   - `community-lite` — minimal free tier (feed + projects + leaderboards)
3. Adjust `OVERRIDES` for one-off tweaks (brand name, contact email, feature toggles).
4. Save → preview → publish.

## Common operations

### Re-brand the deployment
Edit `OVERRIDES.brand`:
```ts
const OVERRIDES: Partial<PlatformConfig> = {
  brand: {
    ...EDITIONS["scope-india"].brand,
    name: "Scope Connect — Kolkata Edition",
    shortName: "Scope",
    accentName: "Kolkata",
    contactEmail: "kolkata@scope.in",
  },
};
```
Logo wordmark, footer, and contact links update automatically.

### Add a campus
Append to the edition's `campuses` array (or use `OVERRIDES.campuses`):
```ts
{ id: "iiit-h", name: "IIIT Hyderabad", city: "Hyderabad", region: "South",
  topSkills: ["Engineering", "AI"], starterScore: 0 }
```

### Toggle a feature
Override the relevant flag:
```ts
features: { ...EDITIONS["scope-india"].features, ads: false, recruiterZone: false }
```
Navbar, footer, and feature-gated routes hide automatically.

### Change locale / region
Override `locale`:
```ts
locale: { locale: "en-SG", currency: "SGD", dateFormat: "DD MMM YYYY", timezone: "Asia/Singapore" }
```

## Plan tiers (`PlanTier`)

| Tier            | Intended for                       | Typical features off   |
|-----------------|------------------------------------|-----------------------|
| `community`     | Free / NGO / school clubs          | events, ads, recruiter |
| `campus-pro`    | Single college edition             | ads, recruiter         |
| `institution`   | Multi-campus university            | ads                    |
| `enterprise`    | Corporate innovation challenge     | feed, ambassadors      |

## Roles & permissions

Defined in `platform-config.ts → ROLES`. Use `hasPermission(role, key)` server-side
or in admin UIs. Keys follow `entity.action[.scope]` (e.g. `campus.manage.local`).

## Internal docs

- `src/lib/platform-config.ts` — config schema + edition packs
- `src/hooks/use-platform.ts` — typed hooks (`useBrand`, `useFeature`, `useCampuses`)
- `src/components/site/Navbar.tsx` & `Footer.tsx` — example consumers
