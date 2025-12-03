# TahOak API Architecture Guide

> **For LLM agents working on API routes, database queries, or data fetching logic.**

## Core Principle

**All category and entity queries must use the helper libraries in `src/lib/`.** These helpers ensure:
- Categories only count ACTIVE entities (preventing the "ghost entity" bug)
- Translations are applied consistently
- Query patterns are not duplicated across routes
- Status filtering happens in one place

---

## Critical Bug Context

**The Problem We Solved:**
Previously, category entity counts included ALL entities (active + inactive). When users clicked a category showing "1 entity," they saw "no entities found" because the listing only showed ACTIVE entities.

**The Solution:**
Centralized the counting logic in `category-helpers.ts` to filter by `ENTITY_STATUS.ACTIVE` at query time.

**The Lesson:**
Always use helpers. Never duplicate query logic across routes.

---

## Helper Libraries

### 1. Category Helpers (`src/lib/category-helpers.ts`)

**Purpose:** Centralized category queries with correct entity counting

```typescript
import { fetchAndTransformCategories, fetchCategories } from "@/lib/category-helpers";
```

#### Key Exports

**`categoryIncludeActiveEntityCount`**
- Prisma include that counts ONLY active entities
- Use for public-facing APIs

```typescript
entities: {
  where: {
    status: ENTITY_STATUS.ACTIVE,
  },
}
```

**`categoryIncludeAllEntityCount`**  
- Prisma include that counts ALL entities
- Use ONLY for admin APIs

**`fetchCategories(options)`**
- Fetches categories with entity counts
- Options: `featured`, `entityType`, `includeInactive`, `requireEntityTypes`

**`transformCategory(category, locale)`**
- Applies translations to a single category
- Handles name, description, fallbacks

**`fetchAndTransformCategories(locale, options)`**
- Combines fetch + transform in one call
- Returns fully translated categories with counts

#### Usage Examples

**Public Category Listing:**
```typescript
// src/app/api/categories/route.ts
const categories = await fetchAndTransformCategories(locale, {
  entityType,
  requireEntityTypes: true,
});
```

**Featured Categories:**
```typescript
// src/app/api/categories/featured/route.ts
const categories = await fetchAndTransformCategories(locale, {
  featured: true,
});
```

**Admin Categories (all entity counts):**
```typescript
// src/app/api/admin/categories/route.ts
const categories = await fetchCategories({
  includeInactive: true,      // Count ALL entities
  requireEntityTypes: false,  // Show all categories
});
```

### 2. Entity Helpers (`src/lib/entity-helpers.ts`)

**Purpose:** Centralized entity queries, includes, translations, and search

```typescript
import { 
  entityIncludeStandard, 
  transformEntity, 
  buildEntityWhereClause,
  buildAdminEntitySearchWhere 
} from "@/lib/entity-helpers";
```

#### Key Exports

**`entityIncludeStandard`**
- Standard Prisma includes for entity queries
- Includes: categories, owner (selected fields), tags with tag details

```typescript
const entity = await prisma.entity.findUnique({
  where: { id },
  include: entityIncludeStandard,
});
```

**`transformEntity(entity, locale)`**
- Applies translations to entity, categories, and tags
- Handles SEO fields with fallbacks
- Supports legacy single category field

**`buildEntityWhereClause(options)`**
- Builds Prisma where clause from common query params
- Handles: status, category, entityType, featured, owner, search
- **Defaults to ACTIVE entities** unless status explicitly provided

**`buildEntitySearchWhere(searchQuery)`**
- Builds search conditions with keyword expansion
- Searches: name, description
- Includes category slug matching

**`buildAdminEntitySearchWhere(searchQuery)`**
- Admin version that also searches address field
- Use ONLY in admin routes

#### Usage Examples

**Public Entity Listing:**
```typescript
// src/app/api/entities/route.ts
const where = await buildEntityWhereClause({
  status,
  categoryId: categoryId || null,
  category: category || null,
  entityType,
  featured,
  searchQuery: searchQuery || null,
});

const entities = await prisma.entity.findMany({
  where,
  include: entityIncludeStandard,
  orderBy,
});

const translatedEntities = entities.map((entity) => 
  transformEntity(entity, locale)
);
```

**Single Entity Fetch:**
```typescript
// src/app/api/entities/[id]/route.ts
const entity = await prisma.entity.findUnique({
  where: { id },
  include: entityIncludeStandard,
});

const translatedEntity = transformEntity(entity, locale);
```

**Featured Entities:**
```typescript
// src/app/api/entities/featured/route.ts
const entities = await prisma.entity.findMany({
  where: {
    featured: true,
    status: ENTITY_STATUS.ACTIVE,
  },
  include: entityIncludeStandard,
  orderBy: { createdAt: "desc" },
});

const translatedEntities = entities.map((entity) => 
  transformEntity(entity, locale)
);
```

**Admin Entity Search:**
```typescript
// src/app/api/admin/entities/route.ts
const where: any = {};

if (status) where.status = status;
if (categoryId) where.categories = { some: { id: categoryId } };
if (entityType) where.entityType = entityType;

if (search) {
  const searchConditions = await buildAdminEntitySearchWhere(search);
  where.OR = searchConditions;
}

const entities = await prisma.entity.findMany({
  where,
  include: entityIncludeStandard,
  orderBy,
});
```

---

## API Route Patterns

### Standard API Route Structure

```typescript
import { NextRequest } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-helpers";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { fetchAndTransformCategories } from "@/lib/category-helpers";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query params
    const someParam = searchParams.get("someParam");
    
    // Use helpers to fetch and transform data
    const data = await fetchAndTransformCategories(locale, {
      // options
    });
    
    return createSuccessResponse(data);
  } catch (error: any) {
    console.error("Error:", error);
    return createErrorResponse(
      `Failed: ${error?.message || "Unknown error"}`,
      500
    );
  }
}
```

### Response Helpers

From `src/lib/api-helpers.ts`:

```typescript
// Success response
return createSuccessResponse(data, "Optional message");
// Returns: { success: true, data, message? }

// Error response  
return createErrorResponse("Error message", 400);
// Returns: { success: false, error: "message" }

// Require authentication
return withAuth(async (user) => {
  // user has id, email, roles
});

// Require specific role
return withRole([ROLE.ADMIN], async (user) => {
  // admin-only logic
});
```

### Locale Detection

```typescript
import { getLocaleFromRequest } from "@/lib/api-locale";

const locale = getLocaleFromRequest(request);
// Returns: "en" | "es"
// Used for translating API responses
```

---

## Common API Tasks

### Task: Fetch Categories for Dropdown

```typescript
const categories = await fetchCategories({
  requireEntityTypes: true,  // Only categories in new system
});
```

### Task: Fetch Categories with Active Entity Counts

```typescript
const categories = await fetchAndTransformCategories(locale, {
  entityType: "COMMERCE",  // Optional filter
});
// Each category has entityCount of ACTIVE entities only
```

### Task: Search Entities with Filters

```typescript
const where = await buildEntityWhereClause({
  status: status || null,  // null = default to ACTIVE
  categoryId: categoryFilter || null,
  entityType: typeFilter || null,
  searchQuery: searchText || null,
});

const entities = await prisma.entity.findMany({
  where,
  include: entityIncludeStandard,
});
```

### Task: Get Single Entity with Translations

```typescript
const entity = await prisma.entity.findUnique({
  where: { id },
  include: entityIncludeStandard,
});

if (!entity) {
  return createErrorResponse("Entity not found", 404);
}

const translated = transformEntity(entity, locale);
return createSuccessResponse(translated);
```

### Task: Admin Query (All Statuses)

```typescript
// Don't use buildEntityWhereClause - it defaults to ACTIVE
const where: any = {};

// Explicitly set status if provided (or omit to see all)
if (statusFilter) {
  where.status = statusFilter;
}

// Add other filters
if (categoryId) {
  where.categories = { some: { id: categoryId } };
}

// Use admin search helper
if (searchQuery) {
  const searchConditions = await buildAdminEntitySearchWhere(searchQuery);
  where.OR = searchConditions;
}

const entities = await prisma.entity.findMany({
  where,
  include: entityIncludeStandard,
});
```

---

## Critical Rules

### ✅ DO

1. **Always use helper libraries** for categories and entities
2. **Use `entityIncludeStandard`** for consistent entity includes
3. **Use `transformEntity()`** to apply translations
4. **Use `buildEntityWhereClause()`** for public entity queries
5. **Default to ACTIVE entities** in public APIs
6. **Detect locale** with `getLocaleFromRequest()` for translated responses
7. **Use response helpers** (`createSuccessResponse`, `createErrorResponse`)

### ❌ DON'T

1. **Never duplicate query logic** - use helpers
2. **Never count entities without status filter** - causes ghost entity bug
3. **Never manually build translation logic** - use `transformEntity()`
4. **Never hardcode includes** - use `entityIncludeStandard`
5. **Never skip locale detection** - APIs must return translated content
6. **Never show inactive entities to public** - use status filter
7. **Never create duplicate search logic** - use search helpers

---

## Status Filtering Behavior

### Public APIs (Default: ACTIVE Only)

```typescript
// buildEntityWhereClause defaults to ACTIVE
const where = await buildEntityWhereClause({ /* ... */ });
// Entities with status=INACTIVE are excluded
```

### Admin APIs (Configurable)

```typescript
// Build where clause manually to control status
const where: any = {};

if (statusFilter) {
  where.status = statusFilter;  // ACTIVE or INACTIVE
}
// If no statusFilter, all statuses are included
```

### Category Counts

```typescript
// Public: Count only ACTIVE entities
await fetchAndTransformCategories(locale, {
  // Uses categoryIncludeActiveEntityCount
});

// Admin: Count ALL entities
await fetchCategories({
  includeInactive: true,  // Uses categoryIncludeAllEntityCount
});
```

---

## Translation Application

All API responses must be translated based on the request locale.

### Automatic Translation

When using helpers, translations are applied automatically:

```typescript
const categories = await fetchAndTransformCategories(locale, options);
// Categories have translated name, description

const entity = transformEntity(rawEntity, locale);
// Entity has translated name, description, seoTitle, seoDescription
// Categories and tags are also translated
```

### Manual Translation (Avoid)

If you must translate manually, use `getTranslatedField()`:

```typescript
import { getTranslatedField } from "@/lib/translations";

const translatedName = getTranslatedField(
  entity.nameTranslations,
  locale,
  entity.name  // fallback
);
```

But prefer using `transformEntity()` instead.

---

## Debugging Tips

### Issue: Categories show wrong entity count

**Check:**
- Are you using `fetchCategories()` or `fetchAndTransformCategories()`?
- Is `includeInactive: false` (or omitted for default)?
- Are you in a public API (should count only ACTIVE)?

**Fix:**
```typescript
// Public route
const categories = await fetchAndTransformCategories(locale, {
  // includeInactive defaults to false
});
```

### Issue: Entities not appearing in public views

**Check:**
- Entity status is ACTIVE (not INACTIVE)
- Using `buildEntityWhereClause()` which defaults to ACTIVE
- Not overriding status filter incorrectly

**Fix:**
```typescript
const where = await buildEntityWhereClause({
  status,  // Pass through from query params
  // If status is null/undefined, defaults to ACTIVE
});
```

### Issue: Translations not working

**Check:**
- Using `getLocaleFromRequest()` at start of handler
- Using `transformEntity()` or `transformCategory()` before returning
- Translation JSON fields exist in database

**Fix:**
```typescript
const locale = getLocaleFromRequest(request);
const entity = await prisma.entity.findUnique({ /* ... */ });
const translated = transformEntity(entity, locale);
return createSuccessResponse(translated);
```

### Issue: Search not working

**Check:**
- Using correct search helper (admin vs public)
- Search query is trimmed and not empty
- Search conditions are added to `where.OR`

**Fix:**
```typescript
if (searchQuery && searchQuery.trim()) {
  const searchConditions = await buildEntitySearchWhere(searchQuery);
  where.OR = searchConditions;
}
```

---

## Migration Guide: Old Pattern → New Pattern

### Before: Manual Category Query

```typescript
// ❌ OLD - duplicated logic, no status filter
const categories = await prisma.category.findMany({
  where: { featured: true },
  include: {
    _count: {
      select: {
        entities: true,  // Counts ALL entities
      },
    },
  },
});

const transformed = categories.map((cat) => ({
  id: cat.id,
  name: getTranslatedField(cat.nameTranslations, locale, cat.name),
  entityCount: cat._count.entities,
  // ... manual transformation
}));
```

### After: Using Helpers

```typescript
// ✅ NEW - single line, correct status filter, translations applied
const categories = await fetchAndTransformCategories(locale, {
  featured: true,
});
```

### Before: Manual Entity Query

```typescript
// ❌ OLD - duplicated includes, manual translation
const entities = await prisma.entity.findMany({
  where: {
    status: ENTITY_STATUS.ACTIVE,
    // ... manual where building
  },
  include: {
    categories: true,
    owner: { select: { id: true, name: true, email: true } },
    tags: { include: { tag: true } },
  },
});

const translated = entities.map((entity) => {
  const translatedName = getTranslatedField(/* ... */);
  // ... lots of manual translation code
  return { ...entity, name: translatedName, /* ... */ };
});
```

### After: Using Helpers

```typescript
// ✅ NEW - concise, consistent, correct
const where = await buildEntityWhereClause({
  status,
  categoryId,
  searchQuery,
});

const entities = await prisma.entity.findMany({
  where,
  include: entityIncludeStandard,
});

const translated = entities.map((entity) => transformEntity(entity, locale));
```

---

## Related Files

| Purpose | File |
|---------|------|
| Category helpers | `src/lib/category-helpers.ts` |
| Entity helpers | `src/lib/entity-helpers.ts` |
| API response helpers | `src/lib/api-helpers.ts` |
| Locale detection | `src/lib/api-locale.ts` |
| Translation utilities | `src/lib/translations.ts` |
| Prisma client | `src/lib/prisma.ts` |
| Enums (status, roles) | `src/lib/prismaEnums.ts` |

---

## When to Create New Helpers

**Create a new helper function when:**
1. Logic is duplicated across 3+ routes
2. Query pattern is complex and error-prone
3. Business logic needs a single source of truth

**Add to existing helpers when:**
1. New entity/category query pattern emerges
2. Translation logic needs extension
3. New search requirements appear

**Keep in route when:**
1. Logic is unique to that specific endpoint
2. Sorting/pagination is route-specific
3. Response formatting is one-off

---

## Quick Reference

### Fetching Categories
```typescript
// Public with translations
fetchAndTransformCategories(locale, { featured?, entityType? })

// Admin without translations
fetchCategories({ includeInactive: true })
```

### Fetching Entities
```typescript
// Build where clause
buildEntityWhereClause({ status?, categoryId?, entityType?, featured?, searchQuery? })

// Standard includes
include: entityIncludeStandard

// Apply translations
transformEntity(entity, locale)
```

### Locale & Responses
```typescript
getLocaleFromRequest(request)
createSuccessResponse(data, message?)
createErrorResponse(message, statusCode)
```

---

## Testing Checklist

When modifying API routes, verify:

- [ ] Categories count only ACTIVE entities (public routes)
- [ ] Translations applied to all text fields
- [ ] Locale detected and used correctly
- [ ] Status defaults to ACTIVE for public routes
- [ ] Admin routes can see all statuses
- [ ] Search includes category matching
- [ ] Response uses `createSuccessResponse` / `createErrorResponse`
- [ ] No duplicate query logic
- [ ] Using helper includes (`entityIncludeStandard`, etc.)
- [ ] Error handling with try/catch
- [ ] Console errors logged
- [ ] Type safety maintained

---

## Summary

**Golden Rules:**
1. Use helpers for all category/entity queries
2. Public APIs show ACTIVE entities only
3. Always apply translations before returning data
4. Never duplicate query logic
5. Default includes and transformations exist - use them

**The helpers exist to prevent bugs and ensure consistency. Always use them.**

