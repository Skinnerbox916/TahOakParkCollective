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

# Database
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed categories and test users
npm run db:generate   # Regenerate Prisma client after schema changes

# Docker (preferred for local dev)
docker compose up -d
docker exec tahoak-web npm install   # Install packages (never from host)
```

**Test credentials** (after seeding): see `README.md`.

## Architecture

### Route Structure

```
src/app/[locale]/
├── (admin)/     # Requires ADMIN role
├── (portal)/    # Requires ENTITY_OWNER or ADMIN
├── (public)/    # Unauthenticated
└── auth/        # Sign-in, sign-up
src/app/api/
├── admin/       # Admin-only endpoints
├── public/      # Unauthenticated endpoints (suggest, report, subscribe, claim)
└── entities/    # Auth-protected entity management
```

### Key Layers

| Path | Role |
|------|------|
| `src/lib/auth.ts` | `getSession()`, `requireAuth()`, `requireRole()`, `isAdmin()`, `isEntityOwner()` |
| `src/lib/api-helpers.ts` | `withAuth()`, `withRole()` middleware; `createSuccessResponse()` / `createErrorResponse()` |
| `src/lib/prisma.ts` | Singleton Prisma client with connection pooling |
| `src/lib/entity-helpers.ts` | Entity validation, slug generation |
| `src/lib/entitySnapshot.ts` / `applyEntitySnapshot.ts` | Approval workflow: snapshot before/after edits |
| `src/lib/ai/` | AI-powered entity research and update suggestions (OpenAI) |

### Data Model Highlights

- **Entity**: Core model. Has `translations` JSON for `{en,es}` name/description/seo. Status: `ACTIVE | PENDING | REJECTED | INACTIVE`.
- **Approval**: Every public mutation creates an approval record (`NEW_ENTITY`, `UPDATE_ENTITY`, `ADD_TAG`, `REMOVE_TAG`, `UPDATE_IMAGE`). Admins approve/reject.
- **Tag**: Three `TagCategory` values — `IDENTITY` (owner-assigned, e.g. Black-owned), `FRIENDLINESS` (admin-verified), `AMENITY`.
- **User roles**: `USER`, `ENTITY_OWNER`, `ADMIN`.

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

- `docs/AGENT_CONTEXT.md` — development context, anti-patterns, Docker commands
- `docs/DATABASE_GUIDE.md` — full schema reference, query patterns, JSON field shapes
- `docs/API_GUIDE.md` — API architecture details
- `docs/TRANSLATION_GUIDE.md` — bilingual system details

## Critical Rules

- **Never hardcode categories, tags, or entities** — the database is the source of truth.
- **Never run `npm install` from the host** — always use `docker exec tahoak-web npm install`.
- **Schema changes require updating all consuming code** — API routes, components, types, seed file.
- **Approval workflow is mandatory** for public mutations — direct DB writes bypass it.
