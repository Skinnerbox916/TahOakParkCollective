# TahOak Development Context

> **Include this document at the start of each agent chat.**

## Project Summary

TahOak Park Collective is a hyper-local business directory for Sacramento neighborhoods (Tahoe Park, Oak Park, etc.). Built with Next.js 16, PostgreSQL/Prisma, Docker.

**Dev environment:** `tahoak.skibri.us`

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
4. **Stop if unexpected**: Don't push through errors — reassess

---

## Entity Model

- **Entity Type** = What it IS (COMMERCE, CIVIC, etc.) — one per entity
- **Categories** = What it's ABOUT (Food & Drink, etc.) — **many per entity**
- Relationship: Entities ↔ Categories is many-to-many
- **Translations:** Entity `name` and `description` support bilingual translations via `nameTranslations` and `descriptionTranslations` JSON fields (format: `{"en": "...", "es": "..."}`). If translations are not provided, the system falls back to the base `name` and `description` fields.

---

## Key Files

| Purpose | File |
|---------|------|
| Data model | `prisma/schema.prisma` |
| Bootstrap seed | `prisma/seed.ts` |
| TypeScript types | `src/types/index.ts` |
| API routes | `src/app/api/` |
| Entity display config | `src/lib/entityDisplayConfig.ts` |

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

Use the `tahoak-db` container which has `psql` installed:

```bash
# Query entities
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT * FROM \"Entity\" LIMIT 10;"

# Query categories with entity counts
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT c.name, COUNT(e.id) FROM \"Category\" c LEFT JOIN \"_CategoryToEntity\" ce ON c.id = ce.\"A\" LEFT JOIN \"Entity\" e ON ce.\"B\" = e.id GROUP BY c.id, c.name;"

# Check entity status distribution
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT status, COUNT(*) FROM \"Entity\" GROUP BY status;"
```

**Important:** Use direct SQL queries via `docker exec tahoak-db psql` - do not create query scripts or diagnostic files that will clutter the codebase.

---

## Current Categories (13)

Food & Drink, Shopping, Beauty & Personal Care, Health & Wellness, Pets, Home & Auto, Professional Services, Arts & Culture, Kids & Education, Community & Faith, Social Services, Government, Parks

---

## Test Users

- `admin@tahoak.com` / `password123` (ADMIN)
- `owner@tahoak.com` / `owner123` (BUSINESS_OWNER)

---

## When in Doubt

1. Ask clarifying questions before creating new files
2. Check `prisma/schema.prisma` for current data model
3. Grep the codebase to understand existing patterns
4. Stop and reassess if something unexpected happens

---

> **Need more detail?** See [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) for tech stack, project structure, troubleshooting, and API reference.

> **Adding entities?** See [ENTITY_ADDITION_RUNBOOK.md](./ENTITY_ADDITION_RUNBOOK.md) for step-by-step instructions on adding entities via direct database insertion.
