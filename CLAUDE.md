# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## What This Is

TahOak Park Collective — a hyper-local business directory for Sacramento neighborhoods (Tahoe Park, Oak Park, Elmhurst, Colonial Park, Curtis Park). Full-stack Next.js 16 app with public directory, entity-owner portal, and admin dashboard. Fully bilingual (English/Spanish).

## Commands

```bash
# Development (all run inside Docker)
npm run dev           # Start Next.js dev server
npm run build         # Build for production
npm run lint          # ESLint
npm test              # Vitest service tests; needs TEST_DATABASE_URL (a migrated DB the tests wipe)

# Database
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed categories and test users
npm run db:generate   # Regenerate Prisma client after schema changes

# Docker (preferred for local dev)
docker compose up -d
docker exec tahoak-web npm install   # Install packages (never from host)
docker exec -e TEST_DATABASE_URL=postgresql://tahoak:<pw>@tahoak-db:5432/tahoak_test tahoak-web npm test
```

The dev container bind-mounts single files (package.json, tsconfig.json, ...). npm and git replace those files rather than editing them, which detaches the mount: after `npm install` in the container, copy `/app/package.json` and `/app/package-lock.json` back out with `docker exec tahoak-web cat ...`, and recreate the container (`docker compose up -d --no-deps tahoak-web`) if it reports a missing mount.

**Test credentials** (after seeding): see `README.md`.

## Architecture

### Route Structure

```
src/app/[locale]/
├── (admin)/     # Requires ADMIN role
├── (portal)/    # Any signed-in user; shows the listings they're a member of
├── (public)/    # Unauthenticated
└── auth/        # Sign-in, sign-up
src/app/api/
├── admin/       # Admin-only endpoints
├── public/      # Unauthenticated endpoints (suggest, report, subscribe)
└── entities/    # Auth-protected entity management
```

### Key Layers

| Path | Role |
|------|------|
| `src/lib/better-auth.ts` | Better Auth config: email + password, emailed codes, passkeys, authenticator 2FA, admin plugin, rate limits |
| `src/lib/auth.ts` | Server helpers: `getSession()`, `getCurrentUser()`, `requireAuth()`, `requireRole()`, `isAdmin()` |
| `src/lib/auth-client.ts`, `src/lib/use-auth.ts` | Browser client and the `useAuth()` hook for client components |
| `src/lib/email/` | Bilingual emails over SMTP (console in dev); `notifyAdmins()` and the contact form go to the site inbox (`CONTACT_EMAIL`, else `EMAIL_REPLY_TO`) |
| `src/lib/rate-limit.ts` | Per-IP limits and honeypot for public forms |
| `src/lib/api-helpers.ts` | `withAuth()`, `withRole()` middleware; `createSuccessResponse()` / `createErrorResponse()` |
| `src/lib/prisma.ts` | Singleton Prisma client with connection pooling |
| `src/lib/entity-helpers.ts` | Entity reads: `entityIncludePublic` / `entityIncludeWithMembers`, `transformEntity()` (applies translations), `buildEntityWhereClause()` (public search) |
| `src/lib/category-helpers.ts` | Category reads; public counts include only ACTIVE entities |
| `src/lib/search-entities.ts` | Free-text listing search: every word must match the name or description (English or Spanish) or a category or tag name, ignoring case and accents |
| `src/lib/entityDisplayConfig.ts` | Which profile sections show per entity type, and `displaySettings` (per-field hide/show) |
| `src/lib/entities/` | **Entity write service.** The only code that writes Entity/EntityTag rows: `proposeNewEntity`, `proposeUpdate`, `approveApproval`, `rejectApproval`, `rebaseApproval`, `deleteEntity` |
| `src/lib/ai/` | AI-powered entity research and update suggestions (OpenAI) |

### Data Model Highlights

- **Entity**: Core model. Has `*Translations` JSON for `{en,es}` name/description/seo. `name` and `description` are the English text: the write service keeps their translations' `en` equal to them (`mirrorEnglish` in `fields.ts`) and stores translations only when another language exists, so editors only edit Spanish there. Status: `ACTIVE | INACTIVE`. `version` is bumped on every write. One `entityType` (what it is: COMMERCE, CIVIC, ...) and many categories (what it's about). Shapes of the JSON fields (`hours`, `socialMedia`, `images`, `displaySettings`) are in `src/types/index.ts` and `src/lib/schemas/entitySchema.ts`.
- **Public reads** show ACTIVE entities only and use `entityIncludePublic`, which never includes members or their emails. Use the helpers above rather than hand-written queries, so counts and translations stay consistent.
- **Approval**: Every entity change is an approval (`NEW_ENTITY`, `UPDATE_ENTITY`). `payload` holds the full new entity, or only the changed fields for an update, with `baseValues`/`baseVersion` recording what they were based on. Admin changes are auto-approved in the same transaction; anyone else's wait for review. Approving refuses fields that changed since submission (409 `conflict`) until an admin edits (rebases) the proposal. Edit forms send the `version` they loaded; a mismatch is 409 `stale_version`.
- **Tag**: Three `TagCategory` values — `IDENTITY` (e.g. Black-owned), `FRIENDLINESS` (admin-verified), `AMENITY`. Only a listing's members add IDENTITY tags; admins, AI and the public can't (they can be removed by an admin). The write service enforces this (`allowIdentityTags` in `apply.ts`).
- **Auth**: Better Auth with database sessions (`AuthSession`, `AuthAccount`, `AuthVerification`, `Passkey`, `TwoFactor`). `User.role` is "user" or "admin", but **admin powers need a strong session** (passkey, or password + authenticator code; `AuthSession.strongAuth`). `toSessionUser()` in `src/lib/auth.ts` only adds `ADMIN` to `roles` for strong sessions, so code that checks `roles` never needs to know. Weaker admin sessions get `adminNeedsStepUp` and the `/auth/step-up` page. Never call `auth.api.*` sign-in/sign-up from routes without your own rate limit; server calls skip Better Auth's.
- **User roles**: `USER`, `ADMIN`. Who manages a listing is `EntityMember` (role `OWNER` or `MANAGER`), not a user role; a listing with no members is unclaimed. Check access with `canManage()` from `src/lib/entities`.
- **Owner opt-in**: a listing is public (ACTIVE) only once its owner has published it, agreeing to the listing terms. The agreement is recorded on the entity (`consentedAt`, `consentedById`, `consentTermsVersion`). Parks and civic listings (`CONSENT_EXEMPT_TYPES` in `src/lib/entities/policy.ts`) are exempt. `apply.ts` refuses to leave any other listing ACTIVE without consent, and a CHECK constraint (`Entity_active_needs_consent`) backs that up. So admin, AI and suggested listings start as private drafts.
  - The admin shares a draft with its owner through a single-use link (`EntityShareLink`, `share-links.ts`) sent by text or email. It opens `/[locale]/preview/[token]`, where the owner signs in, takes the listing over as `OWNER` and publishes it.
  - Owners publish and unpublish themselves (`consent.ts`), with immediate effect. An owner's unpublish withdraws consent.
  - There are no claims: owners come in through share links, or by submitting their own listing.

### API Response Shape

```json
{ "success": true, "data": {...} }
{ "success": false, "error": "...", "fieldErrors": {...} }
```

### i18n

`next-intl` handles routing (`/en/...`, `/es/...`). Translation files at `src/messages/{en,es}.json`. Entity/category names stored as JSON in the database — see `src/lib/translations.ts` and `docs/TRANSLATION_GUIDE.md`.

### Prisma Client Location

Generated to `src/generated/prisma` (not the default location). Import from there, not from `@prisma/client`.

## Key Docs

This file and the code are the reference; `prisma/schema.prisma` is the data model. The rest of `docs/`:

- `docs/TRANSLATION_GUIDE.md` — UI strings, translated database content, machine translation
- `docs/UI_CONVENTIONS.md` — UI components, color tokens, accessibility
- `docs/product-brief.md` — the original Nov 2025 product brief; background only, not binding

## CI and Deploys

- Merging to `main` auto-deploys to production (Coolify). CI (`.github/workflows/ci.yml`) must pass first: migrations-vs-schema check, `tsc`, lint, `next build`, and a boot test of the production image.
- The production image runs `prisma migrate deploy` on start. Write migrations that the currently deployed code can survive (expand first, contract in a later deploy). Prisma selects every column by name, so dropping a column takes two deploys: first mark the field `@ignore` (the client stops reading it), then drop it.
- Lint gates on errors only. `no-explicit-any` and `react-hooks/set-state-in-effect` are temporarily warnings (see `eslint.config.mjs`); don't add new ones.

## Critical Rules

- **Never hardcode categories, tags, or entities** — the database is the source of truth.
- **Never run `npm install` from the host** — always use `docker exec tahoak-web npm install`.
- **Schema changes require updating all consuming code** — API routes, components, types, seed file.
- **All entity writes go through `src/lib/entities`.** No `prisma.entity`/`prisma.entityTag` create/update/delete anywhere else; add a service function instead. Routes map its errors with `entityErrorResponse`.
