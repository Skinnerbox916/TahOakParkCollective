# UI Conventions

How to build UI in TahOak. The code is the reference: read the component before using it.

## Components: use, then extend, then create

1. **Use** a primitive from `src/components/ui/` (Button, IconButton, Badge, Card, Input, Select, Textarea, Modal, Alert, Dropdown, LoadingState, EmptyState, FormSection, Container, Honeypot).
2. **Extend** it when you need something new: add a variant, size or optional prop rather than restyling it at the call site.
3. **Create** a new component only when nothing fits. Feature components go in `src/components/{feature}/` (entity, search, admin, ...); something used across three or more features belongs in `ui/`.

Don't hand-style a `<button>`, `<input>` or `<select>` with utility classes when a primitive exists, and don't build parallel versions of a primitive (an `AdminButton` next to `Button`). Some older pages still do both; move them onto the primitives when you touch them.

Primitives take `variant` and `size` props and a `className` that is merged with `cn()` from `src/lib/utils.ts`.

## Colors and fonts

Colors and fonts are defined once in `src/styles/theme.css` (a Tailwind v4 `@theme` block). Every `--color-*` there becomes a utility, so `--color-primary-600` gives `bg-primary-600`, `text-primary-600` and so on.

| Use | Token |
|-----|-------|
| Brand, links, primary actions, focus | `primary-*` |
| Active, approved, saved | `success-*` |
| Pending, needs attention | `warning-*` |
| Errors, destructive actions | `error-*` |
| Neutral text, borders, surfaces | Tailwind's `gray-*` |

Don't use raw hues for these meanings (indigo, green, yellow, red): use the token, so a rebrand is a change to `theme.css` only. A few raw hues remain on purpose (`blue` for info notes, plus some purple, teal and pink badges).

The body font is set with `next/font` in `src/app/[locale]/layout.tsx` (the root layout) as `--font-body` on `<html>`. It must stay on `<html>`: Tailwind resolves the font variables on `:root`.

The site is light-only; there is no dark mode.

## Accessibility

- Interactive elements need a visible focus state. Use the primitives, or the `focus-ring` class from `src/app/globals.css`.
- Icon-only buttons need an `aria-label` (IconButton requires one).
- Every form field needs a label. The Input, Select and Textarea primitives render one from the `label` prop.

## Text

All UI text is translated: use `useTranslations()` and add keys to both `src/messages/en.json` and `src/messages/es.json`. See [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md).
