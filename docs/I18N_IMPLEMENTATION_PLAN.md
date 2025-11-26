# Internationalization (i18n) Implementation Plan

## Overview
Implement full i18n support for English (en) and Spanish (es) using `next-intl`, with locale-based URL routing (`/{locale}/...`), automatic browser detection, and a manual language switcher.

## Important: Next.js 16 Proxy Approach
This project uses Next.js 16, where `middleware` has been renamed to `proxy`. We will use `proxy.ts` instead of `middleware.ts` and the new Next.js 16 proxy API.

## Implementation Steps

### 1. Install and Configure next-intl
- Install `next-intl` package
- Create i18n configuration file at `src/i18n/config.ts` with locale definitions (en, es)
- Create routing configuration at `src/i18n/routing.ts` for locale-aware navigation
- Create message files structure: `src/messages/en.json` and `src/messages/es.json`

### 2. Update Next.js Configuration
- Modify `next.config.ts` to support next-intl plugin
- **Rename `src/middleware.ts` to `src/proxy.ts`** and update to use Next.js 16 proxy API:
  - Export `proxy` function instead of `middleware`
  - Use new proxy function signature: `export function proxy(request: NextRequest)`
  - Integrate next-intl's locale detection with existing next-auth logic
  - Proxy should:
    - Detect locale from Accept-Language header (fallback to en)
    - Redirect root `/` to `/{locale}` based on detection
    - Preserve locale in URL for all routes
    - Work alongside existing next-auth `withAuth` wrapper
    - Handle both authentication checks and locale routing

### 3. Restructure App Directory for Locale Routing
- Create `src/app/[locale]/layout.tsx` to wrap all locale-specific routes
- Move existing pages under `[locale]` route group:
  - `(public)/page.tsx` → `[locale]/(public)/page.tsx`
  - `(public)/about/page.tsx` → `[locale]/(public)/about/page.tsx`
  - `(public)/terms/page.tsx` → `[locale]/(public)/terms/page.tsx`
  - `(public)/privacy/page.tsx` → `[locale]/(public)/privacy/page.tsx`
  - `(public)/contact/page.tsx` → `[locale]/(public)/contact/page.tsx`
  - `(public)/search/page.tsx` → Already exists, verify structure
  - `auth/signin/page.tsx` → `[locale]/auth/signin/page.tsx`
  - `auth/signup/page.tsx` → `[locale]/auth/signup/page.tsx`
  - `auth/error/page.tsx` → `[locale]/auth/error/page.tsx`
  - `auth/unauthorized/page.tsx` → `[locale]/auth/unauthorized/page.tsx`
- Update root `layout.tsx` to remove locale-specific content (move to `[locale]/layout.tsx`)

### 4. Create Translation Files
Create comprehensive translation files covering:
- **Common UI** (`common` namespace): buttons, labels, navigation
- **Navigation** (`nav` namespace): navbar links, menu items
- **Footer** (`footer` namespace): footer content
- **Home** (`home` namespace): homepage content
- **About** (`about` namespace): about page content
- **Terms** (`terms` namespace): terms of use content
- **Privacy** (`privacy` namespace): privacy policy content
- **Contact** (`contact` namespace): contact form and page
- **Auth** (`auth` namespace): sign in, sign up, error messages
- **Forms** (`forms` namespace): form labels, placeholders, validation messages
- **Errors** (`errors` namespace): error messages, validation errors
- **Search** (`search` namespace): search page (already partially exists)

### 5. Update Components for i18n
- **Navbar** (`src/components/layout/Navbar.tsx`):
  - Replace hardcoded text with `useTranslations('nav')` and `useTranslations('common')`
  - Add language switcher component that preserves current route
- **Footer** (`src/components/layout/Footer.tsx`):
  - Replace hardcoded text with translations
- **Language Switcher Component**:
  - Create `src/components/layout/LanguageSwitcher.tsx`
  - Toggle between en/es
  - Preserve current route path when switching
  - Use `useRouter` from `@/i18n/routing` for locale-aware navigation
- **Form Components**:
  - Update `LoginForm.tsx`, `RegisterForm.tsx` with translations
  - Update all form components to use translated labels and error messages
  - Update validation messages in forms

### 6. Update Static Pages
Convert all static pages to use translations:
- Home page (`[locale]/(public)/page.tsx`)
- About page (`[locale]/(public)/about/page.tsx`)
- Terms page (`[locale]/(public)/terms/page.tsx`)
- Privacy page (`[locale]/(public)/privacy/page.tsx`)
- Contact page (`[locale]/(public)/contact/page.tsx`)
- Auth pages (`[locale]/auth/*`)

### 7. Update Error Handling
- Translate API error responses where possible
- Update error messages in components to use translations
- Ensure validation messages are translated

### 8. Update Links Throughout Application
- Replace `next/link` with locale-aware links where needed
- Use `Link` from `@/i18n/routing` or ensure `href` includes locale prefix
- Update internal navigation to preserve locale

### 9. Testing and Verification
- Verify locale detection from browser
- Test language switcher preserves routes
- Verify all translated content displays correctly
- Test that user-generated content (business names, descriptions) remains untranslated
- Ensure admin and portal routes work with locale routing

## Key Files to Modify/Create

### New Files:
- `src/i18n/config.ts` - i18n configuration
- `src/i18n/routing.ts` - Routing utilities
- `src/messages/en.json` - English translations
- `src/messages/es.json` - Spanish translations
- `src/components/layout/LanguageSwitcher.tsx` - Language switcher component
- `src/proxy.ts` - **NEW** (replaces middleware.ts with Next.js 16 proxy API)

### Modified Files:
- `package.json` - Add next-intl dependency
- `next.config.ts` - Add next-intl plugin
- `src/middleware.ts` → **RENAME TO** `src/proxy.ts` - Update to Next.js 16 proxy API with locale detection and routing
- `src/app/layout.tsx` - Simplify (move locale-specific to [locale]/layout.tsx)
- `src/app/[locale]/layout.tsx` - Create locale-aware root layout
- All pages under `(public)`, `auth` - Move to `[locale]` and add translations
- `src/components/layout/Navbar.tsx` - Add translations and language switcher
- `src/components/layout/Footer.tsx` - Add translations
- All form components - Add translations
- All static pages - Add translations

## Proxy Implementation Details

The `proxy.ts` file will need to:
1. Use Next.js 16 proxy API: `export function proxy(request: NextRequest)`
2. Integrate with next-auth's `withAuth` wrapper (may need to adapt approach)
3. Handle locale detection using next-intl's `createMiddleware` or manual detection
4. Redirect root `/` to `/{locale}` based on browser Accept-Language header
5. Preserve locale in all route redirects
6. Maintain existing authentication checks for admin/portal routes

**Note:** Since next-auth uses `withAuth` middleware wrapper, we may need to:
- Either adapt the proxy to work with next-auth's approach
- Or handle auth checks differently in the proxy
- Or use next-intl's middleware helper and combine with next-auth logic

## Notes
- User-generated content (business descriptions, names) will remain in original language
- No database schema changes required
- Existing `[locale]` routes should be verified and integrated
- Proxy must handle both auth and locale routing
- Next.js 16 proxy runtime is `nodejs` (not edge runtime)
- Use Next.js codemod if needed: `npx @next/codemod@canary middleware-to-proxy .`

