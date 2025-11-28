# Translation Review Notes

- Used `useAdminTranslations` + DeepL-backed helper to auto-translate new keys for:
  - `admin.sidebar`, `admin.dashboard`, `admin.entities`, `admin.pendingChanges` (planned)
  - `portal.dashboard`, `portal.entity`.
- Spanish strings produced via DeepL free tier (`DEEPL_API_KEY`) and lightly reviewed for tone/grammar before committing.
- For future keys:
  1. Run `npx tsx scripts/generate-admin-translations.ts`.
  2. Call `getTranslationService().generatePair("English", "en")` inside a temporary script to prefill Spanish.
  3. Manually proofread before merging.

