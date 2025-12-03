# TahOak Development Context

> **This is the primary reference document for LLM agents working on this project.**

## Project Summary

TahOak Park Collective is a hyper-local business directory for Sacramento neighborhoods (Tahoe Park, Oak Park, Elmhurst, Colonial Park, Curtis Park). Built with Next.js 16, PostgreSQL/Prisma, Docker.

**Dev environment:** `tahoak.skibri.us`

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Maps**: React Leaflet
- **Styling**: Tailwind CSS
- **Deployment**: Docker & Docker Compose
- **i18n**: next-intl (English/Spanish)

---

## Source of Truth

| Data | Lives in | NOT in code |
|------|----------|-------------|
| Categories | Database | No hardcoded lists anywhere |
| Tags | Database | No hardcoded lists anywhere |
| Entities | Database (admin UI) | Never seed production data |
| Entity Types | `prisma/schema.prisma` enum | - |
| Data Model | `prisma/schema.prisma` | - |

**The database is canonical.** Code reads from it.

---

## Anti-Patterns (DO NOT)

1. ❌ Create new seed/data scripts in `/scripts/`
2. ❌ Create database query scripts or diagnostic files - use direct `docker exec` commands instead
3. ❌ Hardcode category/tag/entity lists in code
4. ❌ Define the same data in multiple places
5. ❌ Run `npm install` or `npx` commands from host — always use `docker exec tahoak-web`
6. ❌ Skip searching existing code before creating new files
7. ❌ Make schema changes without updating ALL consuming code

---

## Before Making Changes

1. **Search first**: `grep -r "pattern"` to find all references
2. **Check existing**: Is there already a file/function for this?
3. **Schema changes**: Must update types, APIs, AND components
4. **UI changes**: Check `docs/UI_CONVENTIONS.md` for component usage rules
5. **Stop if unexpected**: Don't push through errors — reassess

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/(admin)/   # Admin routes - requires ADMIN role
│   ├── [locale]/(portal)/  # Entity owner portal (any logged-in user)
│   ├── [locale]/(public)/  # Public pages
│   ├── api/                # API routes
│   └── auth/               # Authentication pages
├── components/
│   ├── admin/              # Admin UI components
│   ├── entity/             # Entity cards, detail, forms
│   ├── home/               # Homepage components
│   ├── layout/             # Navbar, Footer
│   ├── search/             # Search, filters, map
│   ├── tags/               # Tag badges, selectors
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client
│   ├── api-helpers.ts      # API response helpers
│   └── translations.ts     # i18n helpers
└── types/
    └── index.ts            # TypeScript types
```

---

## Entity Model

### Core Concepts

- **Entity Type** = What it IS (COMMERCE, CIVIC, etc.) — one per entity
- **Categories** = What it's ABOUT (Food & Drink, etc.) — **many per entity**
- Relationship: Entities ↔ Categories is many-to-many

### Entity Types

| Entity Type | Description |
|-------------|-------------|
| COMMERCE | Businesses and commercial establishments |
| SERVICE_PROVIDER | Freelancers, contractors, home-based services |
| CIVIC | Government offices, elected officials, public schools |
| PUBLIC_SPACE | Parks, libraries, community centers |
| NON_PROFIT | Charities, churches, mutual aid, neighborhood associations, BIDs |
| EVENT | Recurring community events |

### Categories (13)

| Category | Slug | Entity Types |
|----------|------|--------------|
| Food & Drink | `food-drink` | COMMERCE |
| Shopping | `shopping` | COMMERCE |
| Beauty & Personal Care | `beauty` | COMMERCE, SERVICE_PROVIDER |
| Health & Wellness | `health-wellness` | COMMERCE, SERVICE_PROVIDER, NON_PROFIT |
| Pets | `pets` | COMMERCE, SERVICE_PROVIDER |
| Home & Auto | `home-auto` | COMMERCE, SERVICE_PROVIDER |
| Professional Services | `professional` | COMMERCE, SERVICE_PROVIDER |
| Arts & Culture | `arts-culture` | COMMERCE, NON_PROFIT, EVENT |
| Kids & Education | `kids-education` | CIVIC, COMMERCE, NON_PROFIT |
| Community & Faith | `community-faith` | NON_PROFIT |
| Social Services | `social-services` | NON_PROFIT |
| Government | `government` | CIVIC |
| Parks | `parks` | PUBLIC_SPACE |

### Profile Display by Entity Type

| Entity Type | Map Display | Hours Section | Profile Image (if no map) |
|-------------|-------------|---------------|---------------------------|
| COMMERCE | Yes (if coordinates) | Yes | No |
| SERVICE_PROVIDER | Yes (if coordinates) | Yes | Yes (if no location) |
| CIVIC | Yes (if coordinates) | No | Yes (if no location) |
| PUBLIC_SPACE | Yes (if coordinates) | No | No |
| NON_PROFIT | Yes (if coordinates) | Yes | No |
| EVENT | Yes (if coordinates) | Yes | Yes (if no location) |

**Key Behaviors:**
- Entities without coordinates won't show a map
- CIVIC, SERVICE_PROVIDER, and EVENT entities show profile image (from `hero` field) when no location
- Hours not displayed for CIVIC and PUBLIC_SPACE
- Configuration in `src/lib/entityDisplayConfig.ts`

### Tags
Tags an be added and deleted from the admin dashboard
**Identity (owner-assigned):** E.g., Black-owned, LGBTQ-owned, Women-owned, Veteran-owned, Asian-owned, Immigrant-owned, Indigenous-owned

**Friendliness (admin-verified):** E.g., Kid-friendly, Dog-friendly, Neurodiversity-friendly, Wheelchair-accessible, Senior-friendly, Sensory-friendly

**Amenities (open):** E.g., WiFi, Outdoor Seating, Parking Available, Public Restroom, Accepts Cash, Accepts Cards, Gender-neutral Restrooms, Changing Tables

---

## Translation System

**TahOak is fully bilingual (English/Spanish). All new features must support translations.**

### Two Translation Types

1. **UI Translations** (static text): `useTranslations()` from `next-intl`, stored in `src/messages/{locale}.json`
2. **Content Translations** (database): JSON fields (`nameTranslations`, `descriptionTranslations`), use `getTranslatedField()`

### Content Translations (Database)

Three models support translations via JSON fields:
- **Entity**: `nameTranslations`, `descriptionTranslations`, `seoTitleTranslations`, `seoDescriptionTranslations`
- **Category**: `nameTranslations`, `descriptionTranslations`  
- **Tag**: `nameTranslations`

**Format:** `{"en": "English text", "es": "Spanish text"}`

**Fallback:** If translations missing, system uses base `name`/`description` fields.

**Helper Function:** `getTranslatedField(translations, locale, fallback)` from `src/lib/translations.ts`

### API Locale Detection

APIs automatically detect locale and return translated content. Use `getLocaleFromRequest(request)` from `src/lib/api-locale.ts`.

### When Building New Features

1. **UI text**: Use `useTranslations()` from `next-intl` (never hardcode strings)
2. **Content display**: Use `getTranslatedField()` for entity/category/tag names
3. **API routes**: Detect locale and return translated content
4. **Navigation**: Use `Link`/`useRouter` from `@/i18n/routing` (preserves locale)
5. **New database fields**: If user-facing text, add translation JSON fields

> **Full guide:** See [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md)

---

## Key Files

| Purpose | File |
|---------|------|
| Data model | `prisma/schema.prisma` |
| Bootstrap seed | `prisma/seed.ts` |
| TypeScript types | `src/types/index.ts` |
| API routes | `src/app/api/` |
| Entity display config | `src/lib/entityDisplayConfig.ts` |
| Locale routing/redirects | `src/proxy.ts` |
| i18n config | `src/i18n/routing.ts` |
| Translation messages | `src/messages/{en,es}.json` |

---

## Commands (Always in Docker)

**All commands must run inside the Docker container, not on the host machine.**

```bash
# Install npm packages
docker exec tahoak-web npm install <package-name>

# Migrations
docker exec tahoak-web npx prisma migrate dev --name <name>

# Seed
docker exec tahoak-web npx prisma db seed

# Generate client
docker exec tahoak-web npx prisma generate

# Restart app
docker restart tahoak-web

# Logs
docker logs tahoak-web --tail 50
```

**Why Docker?** The app uses an isolated `node_modules` volume. Packages installed on the host won't be available to the running container.

---

## Database Queries

**Always query the database directly using Docker commands. Do NOT create scripts for database queries.**

```bash
# Query entities
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT * FROM \"Entity\" LIMIT 10;"

# Query categories with entity counts
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT c.name, COUNT(e.id) FROM \"Category\" c LEFT JOIN \"_CategoryToEntity\" ce ON c.id = ce.\"A\" LEFT JOIN \"Entity\" e ON ce.\"B\" = e.id GROUP BY c.id, c.name;"

# Check entity status distribution
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT status, COUNT(*) FROM \"Entity\" GROUP BY status;"
```

---

## API Patterns

### Response Helpers

```typescript
import { createSuccessResponse, createErrorResponse, withAuth, withRole } from "@/lib/api-helpers";

// Success
return createSuccessResponse(data, "Optional message");

// Error
return createErrorResponse("Error message", 400);
```

### Database Queries

- Use Prisma client from `src/lib/prisma.ts`
- Use `include` for relations: `include: { categories: true }`
- Default status filter: `status: ENTITY_STATUS.ACTIVE`

### Key API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/entities` | - | Search entities |
| GET | `/api/entities/[id]` | - | Get single entity |
| GET | `/api/categories` | - | List categories |
| POST | `/api/entities` | ✓ | Create entity |
| PUT | `/api/entities/[id]` | ✓ | Update entity |
| GET | `/api/admin/entities` | Admin | All entities (any status) |

---

## Authentication & Authorization

### Roles

- `USER`: Default for new registrations
- `ENTITY_OWNER`: Assigned to users who own entities
- `ADMIN`: Full access

### Route Protection

- Public: `/`, `/auth/*`
- Entity Portal: `/portal/*` (any authenticated user)
- Admin: `/admin/*` (ADMIN role only)

### API Authorization Helpers

```typescript
withAuth(handler)                    // Require login
withRole([ROLE.ADMIN], handler)      // Require specific role
```

---

## Docker Setup

Database hostname from web container: `tahoak-db` (not `localhost`)

```
DATABASE_URL=postgresql://tahoak:tahoak_password@tahoak-db:5432/tahoak_db
```

Volume mounts enable hot reload. Container runs `npm run dev`.

---

## Troubleshooting

### Code changes not appearing

- Check dev server is running: `docker logs tahoak-web --tail 20`
- Restart: `docker restart tahoak-web`
- Hard refresh browser: Ctrl+Shift+R

### Prisma connection errors

- Verify DATABASE_URL uses `tahoak-db` not `localhost`
- Check database container: `docker ps | grep tahoak-db`

### Prisma client out of sync

```bash
docker exec tahoak-web npx prisma generate
docker restart tahoak-web
```

### Entity not appearing

- Status must be `ACTIVE` (not `INACTIVE`)
- At least one category must be linked
- Prisma client was regenerated after direct DB operations

---

## Test Users

- `admin@tahoak.com` / `password123` (ADMIN)
- `owner@tahoak.com` / `owner123` (ENTITY_OWNER)

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_SECRET` | JWT encryption |
| `NEXTAUTH_URL` | Base URL (`https://tahoak.skibri.us`) |
| `DEEPL_API_KEY` | Auto-translation (optional) |

---

## When in Doubt

1. Ask clarifying questions before creating new files
2. Check `prisma/schema.prisma` for current data model
3. Grep the codebase to understand existing patterns
4. Stop and reassess if something unexpected happens

---

## Related Documentation

- **[API_GUIDE.md](./API_GUIDE.md)** - API architecture, helper libraries, and query patterns
- **[UI_CONVENTIONS.md](./UI_CONVENTIONS.md)** - Component library and styling standards
- **[TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md)** - Complete translation system documentation
- **[ENTITY_ADDITION_RUNBOOK.md](./ENTITY_ADDITION_RUNBOOK.md)** - Step-by-step guide for adding entities
- **[TahOak PRD.md](./TahOak%20PRD.md)** - Product requirements (background context)
