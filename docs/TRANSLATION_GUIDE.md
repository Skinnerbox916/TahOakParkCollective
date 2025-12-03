# Translation System Guide

> **TahOak is fully bilingual (English/Spanish). All new features must support translations.**

For a quick overview, see the Translation System section in [AGENT_CONTEXT.md](./AGENT_CONTEXT.md).

---

## Two Translation Systems

| System | Purpose | Technology | Storage |
|--------|---------|------------|---------|
| **UI Translations** | Static text (buttons, labels) | `next-intl` | `src/messages/{locale}.json` |
| **Content Translations** | User data (entity names) | JSON fields | PostgreSQL JSONB columns |

**Important**: These are separate systems. UI translations use `useTranslations()`, content translations use `getTranslatedField()`.

---

## UI Translations (next-intl)

### Architecture

- **URL-based routing**: All pages under `[locale]` route segment (`/en/...` or `/es/...`)
- **Browser detection**: Proxy (`src/proxy.ts`) detects browser language on first visit
- **Configuration**: `src/i18n/routing.ts`
- **Locales**: `en` (default), `es`

### Translation Files

**Location**: `src/messages/{locale}.json`

**Structure**: Organized by namespaces:
```json
{
  "common": { "save": "Save", "cancel": "Cancel" },
  "nav": { "home": "Home", "search": "Search" },
  "admin": { "dashboard": { "title": "Admin Dashboard" } }
}
```

### Usage in Components

```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations("namespace");
  const tCommon = useTranslations("common");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <button>{tCommon("save")}</button>
    </div>
  );
}
```

### Admin/Portal Helpers

```typescript
import { useAdminTranslations, usePortalTranslations } from '@/lib/admin-translations';

// Admin pages
const { t, tStatus, tRole } = useAdminTranslations("dashboard");
t("title");        // "Admin Dashboard"
tStatus("ACTIVE"); // "Active"
tRole("ADMIN");    // "Admin"

// Portal pages
const tPortal = usePortalTranslations("dashboard");
```

### Locale-Aware Navigation

**Always use locale-aware navigation:**

```typescript
import { Link, useRouter } from '@/i18n/routing';

// Links automatically preserve locale
<Link href="/search">Search</Link>

// Programmatic navigation
const router = useRouter();
router.push("/entities"); // Preserves current locale
```

**Never use** Next.js's default `Link` or `useRouter` - they don't preserve locale.

---

## Content Translations (Database)

### Models with Translations

| Model | Translation Fields |
|-------|-------------------|
| **Entity** | `nameTranslations`, `descriptionTranslations`, `seoTitleTranslations`, `seoDescriptionTranslations` |
| **Category** | `nameTranslations`, `descriptionTranslations` |
| **Tag** | `nameTranslations` |

**Format**: `{"en": "English text", "es": "Spanish text"}`

### Helper Function

**Always use `getTranslatedField()` to extract translated content:**

```typescript
import { getTranslatedField } from '@/lib/translations';

const name = getTranslatedField(
  entity.nameTranslations,  // JSON field from database
  locale,                   // Current locale ("en" or "es")
  entity.name               // Fallback to base field
);
```

**Fallback chain**: Requested locale → English → First available → Base field

---

## SEO Translations

Entity SEO fields (`seoTitleTranslations`, `seoDescriptionTranslations`) enable locale-specific search engine optimization.

### Purpose

- **SEO Title**: Optimized page title for search results (50-60 characters recommended)
- **SEO Description**: Meta description for search snippets (150-160 characters recommended)

### Fallback Behavior

SEO fields have a special fallback chain:

1. SEO translation for current locale
2. SEO translation for English
3. Entity name/description (translated)

```typescript
// In generateMetadata
const seoTitle = getTranslatedField(
  entity.seoTitleTranslations,
  locale,
  `${translatedName} | TahOak Park Collective`  // Fallback
);
```

### Usage in API

**Creating/Updating entities with SEO translations:**

```json
// POST /api/entities or PUT /api/entities/:id
{
  "name": "Coffee Shop",
  "seoTitleTranslations": {
    "en": "Best Coffee Shop in Oak Park | TahOak",
    "es": "La Mejor Cafetería en Oak Park | TahOak"
  },
  "seoDescriptionTranslations": {
    "en": "Discover the best coffee in Oak Park. Local roasts, cozy atmosphere.",
    "es": "Descubre el mejor café en Oak Park. Tostados locales, ambiente acogedor."
  }
}
```

### Best Practices

| Do | Don't |
|----|-------|
| Keep titles under 60 characters | Exceed character limits |
| Include relevant keywords | Keyword stuff |
| Write unique descriptions per locale | Copy-paste between locales |
| Use locale-specific search terms | Assume same keywords work in both languages |

---

## Auto-Translation System

TahOak includes automatic translation powered by DeepL API.

### TranslationService

**Location**: `src/lib/translate/index.ts`

```typescript
import { getTranslationService } from '@/lib/translate';

const service = getTranslationService();
const pair = await service.generatePair("Coffee Shop", "en");
// Returns: { en: "Coffee Shop", es: "Cafetería" }
```

### API Endpoint

**POST** `/api/translate` (requires `ADMIN` or `ENTITY_OWNER` role)

```json
// Request
{ "text": "Coffee Shop", "targetLocale": "es", "sourceLocale": "en" }

// Response
{ "success": true, "data": { "translated": "Cafetería" } }
```

### Client-Side Hook

```typescript
import { useTranslate } from '@/hooks/useTranslate';

const { translate, isTranslating } = useTranslate();
const spanish = await translate("Coffee Shop", "es", "en");
```

---

## API Locale Detection

### Priority Order

1. URL path (`/en/api/entities` or `/es/api/entities`)
2. Query parameter (`?locale=es`)
3. Referer header (extracts locale from referring page)
4. Default (`en`)

### Implementation

```typescript
import { getLocaleFromRequest } from '@/lib/api-locale';
import { getTranslatedField } from '@/lib/translations';

export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  
  const entity = await prisma.entity.findUnique({ where: { id } });
  
  return createSuccessResponse({
    ...entity,
    name: getTranslatedField(entity.nameTranslations, locale, entity.name),
  });
}
```

---

## Best Practices Checklist

When building new features:

- [ ] UI text uses `useTranslations()` hook
- [ ] API routes detect locale with `getLocaleFromRequest()`
- [ ] API responses use `getTranslatedField()` for content
- [ ] Navigation uses `Link`/`useRouter` from `@/i18n/routing`
- [ ] New database fields have translation JSON fields (if user-facing text)

### Do's and Don'ts

| Do | Don't |
|----|-------|
| Use `getTranslatedField()` for content | Access translation JSON directly |
| Use `useTranslations()` for UI text | Hardcode UI text strings |
| Use `@/i18n/routing` for navigation | Use Next.js default Link/useRouter |
| Provide fallback values | Assume translations always exist |

---

## Troubleshooting

### Content translations not appearing

1. Check locale detection: Verify `getLocaleFromRequest()` is working
2. Check database: Ensure translation JSON fields exist and are valid
3. Check fallback: Verify base `name`/`description` fields exist
4. Check API response: Inspect network tab

### UI translations not working

1. Check namespace: Ensure key exists in JSON files
2. Check locale: Verify page is under `[locale]` route
3. Check import: Using `useTranslations()` from `next-intl`?

### Auto-translation failing

1. Check API key: `DEEPL_API_KEY` environment variable set?
2. Check auth: API requires `ADMIN` or `ENTITY_OWNER` role

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot read property 'en' of null" | Accessing JSON directly | Use `getTranslatedField()` |
| "Translation key not found" | Missing key in JSON file | Add to `src/messages/{locale}.json` |
| "Locale not found" | Invalid locale | Check `src/i18n/routing.ts` |

---

## Reference Files

| Purpose | File |
|---------|------|
| Translation helper | `src/lib/translations.ts` |
| Auto-translation service | `src/lib/translate/index.ts` |
| API locale detection | `src/lib/api-locale.ts` |
| Translation hook | `src/hooks/useTranslate.ts` |
| Translation API | `src/app/api/translate/route.ts` |
| i18n routing config | `src/i18n/routing.ts` |
| Locale proxy | `src/proxy.ts` |
| Admin translation helpers | `src/lib/admin-translations.ts` |
| UI messages | `src/messages/{en,es}.json` |
