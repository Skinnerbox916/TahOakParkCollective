# Complete Bilingual Implementation Plan

## Overview
Complete the bilingual (English/Spanish) implementation for TahOak Park Collective by translating all remaining hardcoded text, updating components, moving pages to locale routing, and establishing a foundation for future multi-language and user content translation support.

## Current State Assessment

### ✅ Already Implemented
- Basic i18n infrastructure (`src/i18n/config.ts`, `src/i18n/routing.ts`) ✅
- Translation files for core pages (home, about, contact, terms, privacy, auth, search basics) ✅
- Locale-aware layout (`src/app/[locale]/layout.tsx`) ✅
- Language switcher component exists ✅
- Some pages already using translations under `[locale]/(public)/` ✅
- Navbar and Footer using translations ✅
- Auth forms (LoginForm, RegisterForm) using translations ✅
- Proxy.ts exists and handles locale routing ✅

### ❌ Issues Identified
1. **Components with hardcoded English text** not using translations
2. **Missing translation keys** in JSON files for various UI elements
3. **Duplicate pages** - pages exist both in `(public)/` and `[locale]/(public)/` directories
4. **Pages not using locale routing** - many pages (claim, report, suggest, subscribe, businesses detail) are not under `[locale]/` structure
5. **Component-level hardcoded strings** that need translation keys

## Implementation Steps

### Phase 1: Add Missing Translation Keys

#### Task 1.1: Update Search Namespace
**Files:** `src/messages/en.json`, `src/messages/es.json`

Add missing keys to `search` namespace:
- `subtitle`: "Discover local businesses and organizations in your community" / "Descubre negocios y organizaciones locales en tu comunidad"
- `searching`: "Searching..." / "Buscando..."
- `found`: "{count} {count, plural, one {entity} other {entities}} found" / "{count} {count, plural, one {entidad} other {entidades}} encontradas"
- `showList`: "Show List" / "Mostrar Lista"
- `showMap`: "Show Map" / "Mostrar Mapa"
- `allTypes`: "All Types" / "Todos los Tipos"
- `allCategories`: "All Categories" / "Todas las Categorías"
- `tags`: "Tags" / "Etiquetas"
- `searchTags`: "Search tags..." / "Buscar etiquetas..."
- `hideTags`: "Hide tags" / "Ocultar etiquetas"
- `showTags`: "Show tags" / "Mostrar etiquetas"
- `noCategoriesYet`: "No categories with entities yet." / "Aún no hay categorías con entidades."
- `loadingMap`: "Loading map..." / "Cargando mapa..."

#### Task 1.2: Update Home/Common Namespaces
**Files:** `src/messages/en.json`, `src/messages/es.json`

Add to `home` namespace:
- `learnMore`: "Learn more →" / "Saber más →"
- `entity`: "entity" / "entidad"
- `entities`: "entities" / "entidades"
- `noEntitiesFound`: "No entities found" / "No se encontraron entidades"
- `tryAdjustingSearch`: "Try adjusting your search or filters to find what you're looking for." / "Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas."

### Phase 2: Update Components to Use Translations

#### Task 2.1: Update OmniSearch Component
**File:** `src/components/home/OmniSearch.tsx`
- Add `useTranslations('home')` or `useTranslations('search')`
- Replace "Search businesses..." placeholder with `t('searchPlaceholder')` or appropriate key
- Replace "Search" button text with `tCommon('search')`
- Update router import to use `@/i18n/routing` if needed

#### Task 2.2: Update FeaturedCategories Component
**File:** `src/components/home/FeaturedCategories.tsx`
- Add `useTranslations('home')`
- Replace "No categories with entities yet." with `t('noCategoriesYet')`
- Replace "entity"/"entities" with translated versions using pluralization
- Update `Link` import to use `@/i18n/routing` for locale-aware routing

#### Task 2.3: Update FeaturedBusiness Component
**File:** `src/components/home/FeaturedBusiness.tsx`
- Add `useTranslations('home')`
- Replace "Featured" badge text with translation
- Replace "Learn more →" with `t('learnMore')`
- Update `Link` to use locale-aware routing from `@/i18n/routing`

#### Task 2.4: Update SearchFilters Component
**File:** `src/components/search/SearchFilters.tsx`
- Add `useTranslations('search')` and `useTranslations('forms')`
- Replace "Search entities..." placeholder
- Replace "Entity Type" label with `t('entityType')`
- Replace "All Types" option with `t('allTypes')`
- Replace "Category" label with `t('category')`
- Replace "All Categories" option with `t('allCategories')`
- Replace "Tags" label with `t('tags')`
- Replace "Show tags"/"Hide tags" button text
- Replace "Search tags..." placeholder
- Replace "Clear" button with `tCommon('clear')`

#### Task 2.5: Update EntityList Component
**File:** `src/components/entity/EntityList.tsx`
- Add `useTranslations('search')`
- Replace "No entities found" heading with `t('noEntitiesFound')`
- Replace "Try adjusting your search..." description with `t('tryAdjustingSearch')`

#### Task 2.6: Update EntityMap Component (if needed)
**File:** `src/components/search/EntityMap.tsx`
- Check for any hardcoded UI text
- Add translations if needed

### Phase 3: Resolve Duplicate Pages

#### Task 3.1: Audit Duplicate Pages
**Action:** Identify all pages that exist in both `(public)/` and `[locale]/(public)/`:
- `(public)/search/page.tsx` vs `[locale]/(public)/search/page.tsx`
- `(public)/about/page.tsx` vs `[locale]/(public)/about/page.tsx`
- `(public)/page.tsx` vs `[locale]/(public)/page.tsx`

#### Task 3.2: Create Redirect Strategy
**Options:**
- Option A: Remove `(public)/` versions and update proxy.ts to redirect to locale versions
- Option B: Create redirect pages in `(public)/` that redirect to locale versions

**Recommended:** Update proxy.ts to handle redirects automatically

### Phase 4: Move Remaining Pages Under Locale Structure

#### Task 4.1: Move Business/Entity Detail Pages
**Files to move:**
- `src/app/(public)/businesses/[slug]/page.tsx` → `src/app/[locale]/(public)/businesses/[slug]/page.tsx`
- `src/app/(public)/entities/[slug]/page.tsx` → `src/app/[locale]/(public)/entities/[slug]/page.tsx`

**For each moved page:**
- Add `useTranslations()` hooks
- Replace hardcoded text with translation keys
- Update all `Link` components to use `Link` from `@/i18n/routing`
- Update `generateMetadata` to support locale

#### Task 4.2: Move Claim Pages
**Files to move:**
- `src/app/(public)/claim/page.tsx` → `src/app/[locale]/(public)/claim/page.tsx`
- `src/app/(public)/public/claim/verify/page.tsx` → `src/app/[locale]/(public)/claim/verify/page.tsx`

**Add translations:**
- Create `claim` namespace in translation files
- Translate all form labels, buttons, success/error messages

#### Task 4.3: Move Report Page
**File to move:**
- `src/app/(public)/report/page.tsx` → `src/app/[locale]/(public)/report/page.tsx`

**Add translations:**
- Create `report` namespace in translation files
- Translate all form fields, submission messages

#### Task 4.4: Move Suggest Page
**File to move:**
- `src/app/(public)/suggest/page.tsx` → `src/app/[locale]/(public)/suggest/page.tsx`

**Add translations:**
- Create `suggest` namespace in translation files
- Translate all form fields, submission messages

#### Task 4.5: Move Subscribe Pages
**Files to move:**
- `src/app/(public)/subscribe/page.tsx` → `src/app/[locale]/(public)/subscribe/page.tsx`
- `src/app/(public)/subscribe/verify/page.tsx` → `src/app/[locale]/(public)/subscribe/verify/page.tsx`
- `src/app/(public)/subscribe/manage/page.tsx` → `src/app/[locale]/(public)/subscribe/manage/page.tsx`

**Add translations:**
- Create `subscribe` namespace in translation files
- Translate all form fields, verification messages, manage page content

#### Task 4.6: Add Translation Namespaces for New Pages
**Files:** `src/messages/en.json`, `src/messages/es.json`

Create new namespaces:
- `claim`: Title, description, form labels, buttons, success/error messages
- `report`: Title, description, form fields, submission messages
- `suggest`: Title, description, form fields, submission messages
- `subscribe`: Title, description, form fields, verification messages, manage page content
- `entity` or `businessDetail`: Detail page labels, contact info labels, "View on Map", "Share", etc.

### Phase 5: Fix Search Page

#### Task 5.1: Update Search Page Translations
**File:** `src/app/[locale]/(public)/search/page.tsx`
- Fix missing translation keys (searching, found, showList, showMap, subtitle)
- Ensure all text uses translations
- Verify locale-aware routing works correctly

### Phase 6: Update Links and Navigation

#### Task 6.1: Audit All Links
**Action:** Search codebase for `next/link` imports
- Replace with `Link` from `@/i18n/routing` where needed
- Ensure hrefs don't hardcode locale
- Fix any programmatic navigation to use router from `@/i18n/routing`

### Phase 7: Admin and Portal Pages Decision

#### Task 7.1: Decide on Admin/Portal Translation Strategy
**Question:** Should admin/portal pages be bilingual?

**If yes:**
- Move admin pages under `[locale]/(admin)/` structure
- Move portal pages under `[locale]/(portal)/` structure
- Add admin/portal translation namespaces
- Update all admin/portal components to use translations

**If no:**
- Leave admin/portal pages as English-only
- Document this decision in plan

**Recommendation:** Start with English-only for admin/portal (admins can use English), focus on public-facing pages first.

### Phase 8: Testing and Verification

#### Task 8.1: Comprehensive Testing Checklist
- [ ] All public-facing pages accessible at `/{locale}/...` URLs
- [ ] Language switcher works on all pages
- [ ] All UI text translates correctly
- [ ] No hardcoded English text visible in Spanish mode
- [ ] Links preserve locale when navigating
- [ ] Search functionality works in both languages
- [ ] Forms display translated labels and validation messages
- [ ] Duplicate pages redirect correctly
- [ ] Entity detail pages work with locale routing
- [ ] Browser locale detection works correctly

## Key Files Reference

### Translation Files (to update):
- `src/messages/en.json` - Add missing keys
- `src/messages/es.json` - Add Spanish translations

### Components to Update:
- `src/components/home/OmniSearch.tsx`
- `src/components/home/FeaturedCategories.tsx`
- `src/components/home/FeaturedBusiness.tsx`
- `src/components/search/SearchFilters.tsx`
- `src/components/entity/EntityList.tsx`
- `src/components/search/EntityMap.tsx` (if needed)

### Pages to Move/Update:
- `src/app/(public)/businesses/[slug]/page.tsx`
- `src/app/(public)/entities/[slug]/page.tsx`
- `src/app/(public)/claim/page.tsx`
- `src/app/(public)/report/page.tsx`
- `src/app/(public)/suggest/page.tsx`
- `src/app/(public)/subscribe/page.tsx` (+ subpages)
- `src/app/(public)/public/claim/verify/page.tsx`

### Already Completed (verify these):
- `src/components/layout/Navbar.tsx` ✅
- `src/components/layout/Footer.tsx` ✅
- `src/components/layout/LanguageSwitcher.tsx` ✅
- `src/components/auth/LoginForm.tsx` ✅
- `src/components/auth/RegisterForm.tsx` ✅
- `src/app/[locale]/(public)/page.tsx` ✅
- `src/app/[locale]/(public)/about/page.tsx` ✅
- `src/app/[locale]/(public)/contact/page.tsx` ✅
- `src/app/[locale]/(public)/terms/page.tsx` ✅
- `src/app/[locale]/(public)/privacy/page.tsx` ✅
- `src/app/[locale]/auth/signin/page.tsx` ✅
- `src/app/[locale]/auth/signup/page.tsx` ✅

## Proxy Implementation Notes

**Current:** `src/proxy.ts` already exists and handles locale routing ✅

**If updates needed:**
- Ensure proxy.ts redirects `(public)/` routes to `[locale]/(public)/` versions
- Update hardcoded locale regex if needed: `/^\/(en|es)/`

## Future Considerations: Multiple Languages & User Content Translations

Given the project's small scale (~50-100 entities, ~30k residents, maintained in spare time), we'll use a **simplified approach**:

### Adding More Languages (Keep It Simple)

**Current approach is acceptable:** The hardcoded locale array in `src/i18n/routing.ts` is fine for 2-3 languages. Adding a new language later requires:
- Adding locale to array in `routing.ts` (e.g., `locales: ['en', 'es', 'fr']`)
- Creating new translation JSON file (`src/messages/fr.json`)
- Optionally updating proxy.ts regex (currently hardcoded to `/^\/(en|es)/`)

**No need for environment variables or complex configuration** - simplicity and maintainability are priorities for this scale.

### Translating User Content (JSON Field Approach) - Future Phase

**Decision: Use JSON fields instead of translation tables**

Given the scale constraints:
- ~50-100 entities maximum
- Maintained by volunteers in spare time
- No high traffic expectations
- Prioritize simplicity and maintainability

**Schema Changes (Future Phase):**
Add JSON translation fields to Prisma schema:
- `Entity`: Add `nameTranslations` and `descriptionTranslations` JSON fields
- `Category`: Add `nameTranslations` and `descriptionTranslations` JSON fields
- `Tag`: Add `nameTranslations` JSON field
- Keep existing `name`/`description` fields as fallback/default locale (en)

**Structure:**
```json
{
  "en": "Coffee Shop",
  "es": "Cafetería"
}
```

**Benefits for this scale:**
- Simple implementation (no new tables/migrations)
- Easier for admins (single entity record)
- Performance is fine at this scale
- Easier to maintain and understand
- Direct Prisma access without complex joins

### Implementation Steps for User Content Translations (Future Phase)

**Database Schema Updates:**
- Add JSON fields to Entity, Category, Tag models in Prisma schema
- Create migration that preserves existing data (treat current `name`/`description` as default/en locale)
- Keep existing fields as fallback

**API Updates:**
- Modify `/api/entities`, `/api/categories`, `/api/tags` to accept `?locale=` parameter
- Return translated content when available, fallback to default locale
- Update entity detail endpoints to return translations
- Helper function to extract translated value: `getTranslatedField(obj.translations, locale, fallback)`

**Component Updates:**
- Entity detail pages display translated name/description based on current locale
- Category/Tag displays use translations when available
- Search results show translated content
- Fallback to default locale if translation missing
- Use locale from `useLocale()` hook or URL parameter

**Admin/Portal UI:**
- Add translation management forms for business owners and admins
- Simple interface to add/edit translations per locale
- Show current translations and allow adding new ones
- Validate JSON structure
- Allow owners to translate their own entity listings
- Allow admins to translate categories and tags

**Migration Strategy:**
- Existing `name` and `description` fields become the default/en locale
- Migration script: Copy existing values to `nameTranslations.en` and `descriptionTranslations.en`
- Keep original fields for backward compatibility during transition
- Eventually deprecate original fields once all content has translations

**Considerations:**
- User-generated content (entity names, descriptions) should be translatable
- Category and tag names should be translatable
- Maintain existing data as default/en locale during migration
- Consider UI for bulk translation or import/export

## Notes

- User-generated content (business names, descriptions) currently remains untranslated (Phase 1)
- Category names and tags from database currently remain untranslated (Phase 1)
- Future phases will add support for translating user content using JSON fields
- The duplicate `(public)/` directory structure suggests the migration to locale routing was incomplete
- Next.js 16 proxy runtime is `nodejs` (not edge runtime)
- Proxy already exists and handles locale routing ✅
