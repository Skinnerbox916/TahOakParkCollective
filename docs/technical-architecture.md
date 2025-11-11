# Technical Plan – Tahoe Park Business Directory

Lean blueprint for implementing the MVP on the existing WordPress stack.

## 1. Stack & Environment
- Runtime: Existing `wordpress-wordpress-1` container (PHP 8.4, FPM) behind Caddy reverse proxy.
- File system: `/srv/data/wordpress/html` (mounted locally at `~/jarvis/srv/data/wordpress/html`).
- Database: `wordpress` schema on `wordpress-db-1` (MariaDB 11.4). Access via `wp` user (`Mark.Tom.and.TravisWP`).
- Version control: GitHub repo `Skinnerbox916/TahOakParkCollective`, clones on Framebuntu + Jarvis.
- Deployment: manual `git pull` on Jarvis → `docker compose restart wordpress` if needed.

## 2. Theme & Plugin Strategy
- Create custom theme `tahoak-park-directory` for layout, styling, map UI, and frontend components.
- Build lightweight plugin `tahoak-directory-core` for data model (custom post type + taxonomies + custom fields) and admin tools.
- Use Composer? _Decision needed_. For now, stick with vanilla theme/plugin structure to keep dependencies minimal.
- Ensure both theme and plugin are versioned in Git repo under `wp-content/` subdirectories (symlink or direct development via mount).

## 3. Data Model
- Custom post type: `business`.
  - Supports: title (business name), editor (optional description), thumbnail (future), custom meta.
  - Visibility: public, has archive, REST API enabled for future use.
- Taxonomies:
  - `service_type` (hierarchical) – curated categories.
  - `feature_tag` (non-hierarchical) – future use for ownership/diversity tags (keep disabled in UI until needed).
- Meta fields (store via ACF-like lightweight approach or custom meta boxes):
  - `google_maps_url` (string, required).
  - `address`, `phone`, `hours`, `website`, `instagram`, etc. (optional for future).
- Consider using WordPress native custom fields (register via `register_post_meta`) for type-safety + REST exposure.

## 4. Admin Experience
- Custom admin menu or submenu under “Businesses”.
- Custom columns in list table: category, Google Maps link, status.
- Owner request form → WP Form plugin or custom handler: prefer simple custom form capturing name, business, change request; send email to admin + log to custom post type `submission` or database table.
- Provide instructions / help tab for manual data entry workflow.

## 5. Frontend Architecture
- Theme templates:
  - `archive-business.php`: map + filter UI + list results.
  - `single-business.php`: minimal profile with map link, optional future fields.
  - `front-page.php` or custom page template to host the directory if we keep default blog behavior separate.
- Map implementation:
  - Use Leaflet JS + OpenStreetMap tiles (via free provider like MapTiler/Thunderforest with API key or self-hosted tile server if needed).
  - Preload business geo-coordinates: parse from Google Maps link or store lat/lon meta (preferred future-proofing).
  - Build WP REST endpoint or inline JSON to pass business data to JS map.
- Filters:
  - Frontend filter bar for service types; use JS to filter list + markers client-side.
  - Provide query parameter fallback (`?service_type=cafes`) for shareable filtered views.
- Styling: use Sass or vanilla CSS with build step (optional). Keep assets light; consider using Vite or WordPress build tools if necessary.

## 6. Search (Fast Follow)
- Investigate WordPress native search with custom query modifications vs. external search (Algolia, ElasticPress). Probably start with WP query hooking into CPT fields.
- For MVP, ensure architecture won’t block adding search soon (data stored in standard tables, REST accessible).

## 7. Map & Geocoding Considerations
- If storing lat/lon, we need geocoding source: Google Maps API (paid), OpenStreetMap Nominatim (rate limits), etc. For MVP, rely on manual entry or parsing from Google Maps share URL.
- Cache tile usage to stay within free limits; respect provider terms.
- Provide fallback (static list message) if map fails to load.

## 8. Performance & Caching
- Leverage existing Caddy reverse proxy + Redis object cache.
- Implement transient caching for map data (JSON) to avoid heavy queries.
- Defer third-party scripts (map, analytics) and lazy-load as needed.
- Ensure theme enqueue only loads assets on directory pages to keep WordPress lightweight elsewhere.

## 9. Security & Access
- Keep WordPress up to date (core v6.8.3). Use WP-CLI for updates.
- Limit file permissions via container defaults. Develop via mount but ensure final theme/plugin are committed to repo.
- Owner request form: add basic spam protection (honeypot or simple question). No user accounts aside from admins.

## 10. Tooling & Workflow
- WP-CLI now installed; use `docker exec -u www-data wordpress-wordpress-1 wp ...` for migrations/ops.
- Consider `wp scaffold` to generate CPT/Theme skeletons.
- Local editing via mount (`~/jarvis/...`); sync back to repo before push.
- Unit/integration tests (optional for MVP). At minimum, add theme check (PHPCS/WPCS) later.

## 11. Launch Checklist (for later)
- Update site URL/domain when ready.
- Run through accessibility + performance checks (Lighthouse).
- Enable backups + confirm restore path.
- Announce / gather beta feedback via existing channels.

_This doc should evolve as we make decisions; keep it concise._
