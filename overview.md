# Neighborhood Business Directory Project

## Mission
Build a lightweight neighborhood business directory website that runs on the existing WordPress container (`wordpress-wordpress-1`) managed behind Caddy on Jarvis. The site will catalog local businesses, making it easy for residents to browse, search, and discover new services.

## Platform Strategy
- **WordPress reuse**: Repurpose the idle WordPress container already deployed on Jarvis. This avoids provisioning new infrastructure and keeps maintenance centralized.
- **Custom experience**: Deliver a tailored theme (and companion plugin if needed) instead of licensing a commercial directory theme. We retain full control of layout, features, and data model.
- **Directory focus**: Model a `Business` content type with structured metadata (categories, location details, contact info, hours, web/social links) to power filters and search.

## Proposed Buildout
1. **Environment reset**
   - Audit the current WordPress database and content. Remove or archive placeholder entries so we start clean.
   - Confirm `wp-config.php` matches the target domain, and update salts/keys if needed.
2. **Domain & routing**
   - Choose the production hostname (e.g., `neighbors.example.com`).
   - Update the Caddyfile block to use the final domain(s); validate and reload Caddy.
   - Point DNS A/AAAA records to Jarvis when ready so Caddy can provision certificates automatically.
3. **Data model**
   - Register a custom post type `business` and supporting taxonomies (e.g., `business_category`, `neighborhood`).
   - Define custom fields for address, phone, email, website, hours, short description, featured image, and map coordinates.
4. **Admin authoring tools**
   - Build custom editor blocks or metaboxes for the business fields to keep data entry simple.
   - Create import/export scripts if bulk loading listings becomes necessary.
5. **Theme development**
   - Scaffold a block theme tailored to the directory use case: responsive layout, typography, color palette.
   - Create reusable patterns for business cards, category grids, and callouts.
   - Implement archive templates with filters/search (AJAX or simple form-based) and a map view using Leaflet + OpenStreetMap.
6. **Frontend features**
   - Build single business pages with rich detail, structured data (schema.org `LocalBusiness`), and optional review/testimonial sections.
   - Add global search (leveraging WP query + custom field filters) and category/neighborhood filtering UI.
   - Ensure accessibility and performance best practices (lazy loading images, caching, CSS/JS bundling).
7. **Content operations**
   - Establish content guidelines for consistent listings (data completeness, photography, tagging).
   - Configure WordPress roles/capabilities for future collaborators (if any) and enable backups.
8. **Launch readiness**
   - Draft QA checklist (browser/device tests, forms, maps, performance).
   - Set up monitoring/logging touchpoints (Caddy logs, WordPress health checks).
   - Plan soft launch (internal review) before announcing publicly.

## Next Decisions
- Final domain name and any staging URL.
- Prioritized feature set (e.g., is map view critical for MVP?).
- Preferred design direction (color palette, typography inspiration).

Once we settle the decisions above, we can initialize a git repo in this directory, start the custom theme/plugin scaffolding, and move into development.
