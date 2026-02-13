# TahOak Database Reference

> **For LLM agents working on database operations, schema changes, or data modeling.**

## Quick Facts

- **Database**: PostgreSQL 16 (`tahoak-db` container)
- **ORM**: Prisma (client at `src/lib/prisma.ts`)
- **Schema**: `prisma/schema.prisma`
- **Connection**: Use `tahoak-db` hostname from Docker, `localhost` from host
- **Data Source of Truth**: Categories, tags, entities live in DB (never hardcoded)
- **Query Helpers**: Use helpers from `src/lib/category-helpers.ts` and `src/lib/entity-helpers.ts` (see [API_GUIDE.md](./API_GUIDE.md))

---

## Docker Commands

```bash
# Prisma operations (always run in container)
docker exec tahoak-web npx prisma generate
docker exec tahoak-web npx prisma migrate dev --name <name>
docker restart tahoak-web  # After schema changes

# Direct SQL queries (diagnostics only)
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT ..."
```

---

## Schema Reference

### User

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID, Primary Key |
| `email` | String? | Unique |
| `password` | String? | Hashed (bcrypt) |
| `roles` | Role[] | Default: `[USER]`, values: USER, ADMIN, ENTITY_OWNER |

**Relations:** `entities` → Entity[] (via `ownerId`)

**Cascade:** DELETE User → **RESTRICT** (must reassign/delete entities first)

### Entity

**Core fields:**
- `name`, `slug` (unique), `description` (Text)
- `entityType` (COMMERCE, CIVIC, PUBLIC_SPACE, NON_PROFIT, EVENT, SERVICE_PROVIDER)
- `status` (ACTIVE, INACTIVE, PENDING_REVIEW) - default: ACTIVE
- `ownerId` → User (RESTRICT on delete)

**Translation fields (JSON):**
- `nameTranslations`, `descriptionTranslations`, `seoTitleTranslations`, `seoDescriptionTranslations`
- Format: `{"en": "...", "es": "..."}`

**JSON fields:** (see JSON Field Structures section for formats)
- `hours` - BusinessHours
- `socialMedia` - SocialMediaLinks
- `images` - `{hero, logo}`
- `displaySettings` - Field visibility controls

**Relations:**
- `categories` → Category[] (many-to-many via `_CategoryToEntity`)
- `tags` → EntityTag[]
- `approvals` → Approval[] (two relations: created entity, target entity)

**Indexes:** slug, status, ownerId, featured, entityType

**Cascade:** DELETE Entity → **CASCADE** to EntityTag, Approval

---

### Category

| Field | Type | Notes |
|-------|------|-------|
| `name`, `slug` | String | Both unique |
| `nameTranslations`, `descriptionTranslations` | Json? | `{"en": "...", "es": "..."}` |
| `entityTypes` | EntityType[] | Restricts which entity types can use this category |
| `featured` | Boolean | Default: false |

**Relations:** `entities` → Entity[] (many-to-many)

**Note:** Categories live in database (never hardcoded). Empty `entityTypes` = all types allowed.

---

### Tag

| Field | Type | Notes |
|-------|------|-------|
| `name`, `slug` | String | Both unique |
| `category` | TagCategory | IDENTITY, FRIENDLINESS, AMENITY |
| `nameTranslations` | Json? | `{"en": "...", "es": "..."}` |

**Relations:** `entities` → EntityTag[]

**Tag Categories:**
- IDENTITY: Owner-assigned (Black-owned, LGBTQ-owned, Women-owned)
- FRIENDLINESS: Admin-verified (Kid-friendly, Dog-friendly, Wheelchair-accessible)
- AMENITY: Open tags (WiFi, Outdoor Seating, Parking Available)

---

### EntityTag (Join Table)

| Field | Type | Notes |
|-------|------|-------|
| `entityId`, `tagId` | String | Unique pair |
| `verified` | Boolean | For FRIENDLINESS tags (admin approval) |
| `createdBy` | String? | User ID who added tag |

**Cascade:** DELETE Entity/Tag → **CASCADE** (removes assignments)

---

### Approval

**Purpose:** Moderation workflow for entity submissions/changes

| Field | Type | Notes |
|-------|------|-------|
| `type` | ApprovalType | NEW_ENTITY, UPDATE_ENTITY, ADD_TAG, REMOVE_TAG, UPDATE_IMAGE |
| `status` | ApprovalStatus | PENDING, APPROVED, REJECTED |
| `proposedEntityData` | Json | Complete entity snapshot |
| `targetEntityId` | String? | For UPDATE_ENTITY (existing entity) |
| `entityId` | String? | For NEW_ENTITY (created draft) |
| `source` | String? | "ai", "public", "owner", "admin" |

**Workflow:**
- NEW_ENTITY: Draft entity created with `PENDING_REVIEW` status, linked via `entityId`
- UPDATE_ENTITY: Proposed changes in `proposedEntityData`, references existing via `targetEntityId`

**Indexes:** status, type, entityId, targetEntityId, submittedBy

---

### Many-to-Many: _CategoryToEntity

Implicit Prisma join table linking entities to categories.

| Field | Type |
|-------|------|
| `A` | String (Category ID) |
| `B` | String (Entity ID) |

**Cascade:** DELETE Category/Entity → CASCADE (removes links)

---

### Other Models

See `prisma/schema.prisma` for:
- **IssueReport**: User-submitted entity issues
- **Subscriber**: Newsletter subscriptions
- **MagicLink**: Passwordless auth links
- **Account, Session, VerificationToken**: NextAuth tables

---

## Enums

Defined in `prisma/schema.prisma`, imported via `src/lib/prismaEnums.ts`:

**Role:** USER, ADMIN, ENTITY_OWNER

**EntityType:** COMMERCE, CIVIC, PUBLIC_SPACE, NON_PROFIT, EVENT, SERVICE_PROVIDER
- Display rules: See `src/lib/entityDisplayConfig.ts`

**EntityStatus:** ACTIVE, INACTIVE, PENDING_REVIEW
- Public APIs: Always filter to ACTIVE only (use helpers from API_GUIDE.md)

**TagCategory:** IDENTITY, FRIENDLINESS, AMENITY

**ApprovalType:** NEW_ENTITY, UPDATE_ENTITY, ADD_TAG, REMOVE_TAG, UPDATE_IMAGE

**ApprovalStatus:** PENDING, APPROVED, REJECTED

**IssueType:** INCORRECT_INFO, CLOSED, INELIGIBLE, OTHER

**ReportStatus:** PENDING, RESOLVED, DISMISSED

**MagicLinkPurpose:** VERIFY_SUBSCRIPTION, MANAGE_PREFERENCES, CLAIM_ENTITY

---

## JSON Field Structures

### Translation Fields (`nameTranslations`, `descriptionTranslations`, `seoTitleTranslations`, `seoDescriptionTranslations`)

```json
{"en": "English text", "es": "Spanish text"}
```

Used in Entity, Category, Tag. See [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md).

---

### hours (Entity.hours)

```json
{
  "monday": { "open": "09:00", "close": "17:00", "closed": false },
  "tuesday": { "open": "09:00", "close": "17:00", "closed": false },
  "sunday": { "closed": true }
}
```

- 24-hour format (`HH:MM`)
- Closed days: `{"closed": true}` (omit open/close)
- Partial objects allowed (only include days with data)
- Use `null` if not applicable (CIVIC, PUBLIC_SPACE don't display hours)

---

### socialMedia (Entity.socialMedia)

```json
{
  "facebook": "https://www.facebook.com/example",
  "instagram": "https://www.instagram.com/example",
  "twitter": "https://twitter.com/example"
}
```

Supported platforms: facebook, instagram, twitter, linkedin, youtube, tiktok, threads

---

### images (Entity.images)

```json
{
  "hero": "https://example.com/hero.jpg",
  "logo": "https://example.com/logo.png"
}
```

- `hero`: Profile/cover image (large display)
- `logo`: Card/avatar image (small display)
- CIVIC entities without coordinates show hero as profile photo

---

### displaySettings (Entity.displaySettings)

```json
{
  "address": true,
  "phone": false,
  "website": true,
  "hours": true,
  "socialMedia": true,
  "location": false
}
```

Controls field visibility on public profile (data preserved when hidden). See `src/lib/entityDisplayConfig.ts`.

---

### proposedEntityData (Approval.proposedEntityData)

Complete entity snapshot for approval workflow. Same structure as Entity fields. Always use `normalizeEntityInput()` helper from `src/lib/normalizeEntityInput.ts` before storing.

---

## Project-Specific Conventions

### Query Helpers

**Always use these helpers** (not manual Prisma queries):
- `src/lib/category-helpers.ts` - Category queries with correct entity counts
- `src/lib/entity-helpers.ts` - Entity queries, includes, search
- See [API_GUIDE.md](./API_GUIDE.md) for full details

**Why:** Helpers ensure ACTIVE-only entity counts and consistent translations.

---

### Data Normalization

**Always use before creating/updating entities:**
```typescript
import { normalizeEntityInput } from "@/lib/normalizeEntityInput";

const normalized = normalizeEntityInput(entityData);
// Trims strings, converts empties to null, cleans JSON fields
```

---

### Cascade Behaviors (Important)

- DELETE User → **RESTRICT** (can't delete user with entities)
- DELETE Entity → **CASCADE** to EntityTag, Approval
- DELETE Category → **CASCADE** to `_CategoryToEntity` links
- DELETE Tag → **CASCADE** to EntityTag

---

### Required After Schema Changes

```bash
docker exec tahoak-web npx prisma generate
docker restart tahoak-web
```

---

## SQL Escaping (Direct Queries)

Table/field names: `"Entity"`, `"entityId"` (double quotes)
String values: `'ACTIVE'` (single quotes)
Apostrophes: `'Owner''s Choice'` (double them)
JSON: `'{"key": "value"}'::jsonb` (single quotes + cast)

---

## Related Documentation

- [AGENT_CONTEXT.md](./AGENT_CONTEXT.md) - Primary development context
- [API_GUIDE.md](./API_GUIDE.md) - Query helpers and API patterns
- [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md) - Translation field usage
- [ENTITY_ADDITION_RUNBOOK.md](./ENTITY_ADDITION_RUNBOOK.md) - Step-by-step entity creation

