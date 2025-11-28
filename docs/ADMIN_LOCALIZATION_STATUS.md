# Admin Localization Status

## Completed
- Sidebar, dashboard, entities page, shared components (StatusBadge, RoleBadge, EntityTable)
- Portal dashboard + entity editor

## Remaining Admin Views
| Area | Status | Notes |
|------|--------|-------|
| Pending Changes | Pending | Update `src/app/[locale]/(admin)/admin/pending-changes/page.tsx`, `PendingChangesTable`, `ChangeReviewModal` to use `useAdminTranslations("pendingChanges")` and the helper script for strings. |
| Suggestions, Issue Reports, Subscribers, Analytics | Pending | Run `scripts/generate-admin-translations.ts` to capture text nodes, then add keys under `admin` namespace following the patterns established for dashboard/entities. |

### Recommended Process
1. Run `npx tsx scripts/generate-admin-translations.ts` to list hardcoded strings per file.
2. Add keys to `src/messages/en.json` and `es.json` under a dedicated namespace (e.g., `admin.pendingChanges`).
3. Use `useAdminTranslations("<namespace>")` inside the component to replace literal strings.
4. Use `tCommon("loading")`, `tStatus`, and `tRole` helpers where applicable.
5. For modals/tables, keep column/label keys grouped (e.g., `table.columns.status`, `modal.actions.approve`).

This process mirrors the work done for dashboard/entities and keeps translations consistent.

