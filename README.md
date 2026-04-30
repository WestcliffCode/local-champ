# LocalChamp

Community-first local business directory with merchant verification, tap-to-redeem coupons, and Local Loop community scoring.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **CMS:** Payload CMS 3.x (runs as a Next.js route handler)
- **Database:** Postgres via Supabase (PostGIS enabled)
- **ORM:** Drizzle
- **Auth:** Supabase Auth (consumers/scouts) + Payload Auth (merchants/admins)
- **Styling:** Tailwind 4 + Shadcn/UI
- **State:** TanStack Query
- **Search:** Postgres FTS (pgvector deferred to v1.1)
- **Build:** Turborepo + pnpm workspaces

## Layout

```
apps/
  web/         # Next.js 16 app, hosts Payload at /admin
packages/
  db/          # Drizzle ORM client + schemas + Supabase wiring
  ui/          # Shadcn/UI primitives + Tailwind tokens
  logic/       # Scoring (CPS, Local Loop, Scout Badge), AEO JSON-LD
  types/       # Shared TypeScript interfaces
```

## Heritage Tones

| Token         | Hex       |
| ------------- | --------- |
| Forest Green  | `#0C401E` |
| Cream         | `#FBEDD4` |
| Charcoal      | `#314245` |

## Schema ownership

- **Payload owns** `businesses`, `coupons` (merchant-edited entities). Source of truth lives in Payload migrations.
- **Drizzle owns** `redemptions`, `sourcing`, `scouts` (programmatic, query-heavy). Drizzle introspects Payload-owned tables for typed reads.

## Auth boundaries

- `(directory)`, `(scout)` route groups → Supabase Auth via `@supabase/ssr` middleware.
- `/admin`, `/merchant` route groups → Payload session.
- No shared session. Merchants link to a business via Payload `business_id` field.

## Local development

```bash
pnpm install
cp .env.example .env.local
# Fill in Supabase credentials (see Phase 0 setup notes)
pnpm dev
```

## MVP scope

**In:** directory + pSEO routes, claim/verify (Twilio Voice), coupons, tap-to-redeem with anti-fraud token, Local Loop scoring, Scout Badge gamification.

**Deferred to v1.1+:** pgvector semantic search, 4over print fulfillment, Expo mobile app.
