# Tahoe Park Business Directory – Working PRD

Lean plan for a small team (and an LLM agent) to ship the MVP. Update sections as decisions land.

## 1. Product Snapshot
- **What we’re building**: A map-first WordPress directory showcasing Tahoe Park and Oak Park businesses, powered by a custom theme + lightweight plugin.
- **Why it matters**: Residents who want to shop local lack a single, reliable directory. A curated, searchable map keeps spending in the neighborhood and spotlights small businesses.
- **Definition of “shipped”**: Map interface with category filters, paired list of businesses, and minimal profiles linking to Google Maps for details.
- **Future horizon**: Diversity-owned tags (Black-owned, woman-owned, LGBTQ+, immigrant-owned, veteran-owned, etc.) and an owner portal for self-service updates.

## 2. Audience & Core Jobs
- **Residents**: Quickly find a local business that fits the immediate need (coffee, child care, legal help, artists, home bakeries, etc.) without leaving the neighborhood; long-term target is near-parity with Google Maps results.
- **Business owners**: Request additions/updates via a simple web form in MVP (self-service portal deferred until post-MVP).

## 3. Must-Have Capabilities
- Map-first browsing with category filter chips and a synchronized list of businesses.
- Filters limited to business/service type for MVP (spatial context handled by the map).
- Business cards show name + quick action to open Google Maps in a new tab (or modal—decision pending).
- Lightweight admin workflow: custom post type for businesses + internal interface for adding/editing, plus owner request form that emails admins.

## 4. Content & Data Model
- **Required fields**: Business name, service type/category, Google Maps link.
- **Optional (future)**: Address, phone, hours, description, ownership tags, photos, social links.
- **Categories**: Curated list covering food & drink, retail, services, creative, childcare, health, etc. (final taxonomy to define before data entry).
- **Data sourcing**: Manual entry for MVP; explore scraping/import from Google Maps/Yelp later.

## 5. UX Notes
- Landing view: map + filter bar, list of businesses below (or beside on desktop). On mobile, stack map above list with sticky filter control.
- Business list cards should be scannable (name, category, map link button).
- Map integration must support category-based marker styling or grouping; provide graceful fallback if script fails.
- Accessibility: keyboard navigation for filters/list, descriptive marker text, sufficient contrast, mobile-friendly tap targets.

## 6. Visual Direction
- Palette / vibe anchors: _to be defined (goal is welcoming neighborhood energy, not corporate)._ 
- Typography + component tone: _to be defined._
- Imagery/illustration guidance: _to be defined._

## 7. Technical & Delivery Notes
- Custom theme handles layout, styles, and map UI; companion plugin (or theme includes) defines custom post type + taxonomies.
- Map integration likely via Leaflet + OpenStreetMap (evaluate Kagi/Google free tier). Decide on geocoding/storage approach.
- Include simple analytics (e.g., Plausible or Google Analytics) and ensure performance via caching + minimal dependencies.
- Deployment: develop on staging (`staging.canopyds.com`), version control in GitHub, manual deploy via git pull on Jarvis.

## 8. Content & Ops Checklist
- Remove default WP demo content once MVP structure is ready.
- Back up database/files before major milestones (coordinate with existing backup routines).
- Owner request form routes to admin email; add lightweight triage process (e.g., Trello/Notion or GitHub issues).
- Post-launch: schedule quarterly content audits and plugin/theme updates.

## 9. Open Questions / Parking Lot
- Final map provider + licensing considerations.
- Domain strategy & redirects when moving beyond staging.
- Redis cache configuration impact on custom theme/plugin.
- Search implementation timing & technology.
- Diversity-owned tagging UX/operations.
- Any additional integrations (newsletter signup, events, etc.).
