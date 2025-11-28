# Entity Types and Categories

This document describes the entity classification system for TahOak Park Collective.

> **Source of Truth:** The database is the canonical source for categories. This document is for reference only. Categories are managed via the admin UI after initial seed.

---

## Entity Types

Entity Types define the **nature** of an entity (what it IS):

| Entity Type | Description |
|-------------|-------------|
| COMMERCE | Businesses and commercial establishments |
| SERVICE_PROVIDER | Freelancers, contractors, home-based services |
| CIVIC | Government offices, elected officials, public schools |
| ADVOCACY | Neighborhood associations, BIDs, community groups |
| PUBLIC_SPACE | Parks, libraries, community centers |
| NON_PROFIT | Charities, churches, mutual aid organizations |
| EVENT | Recurring community events |

---

## Categories

Categories define **what an entity is about** (for user discovery). Entities can belong to **multiple categories**.

| Category | Slug | Description | Entity Types |
|----------|------|-------------|--------------|
| Food & Drink | `food-drink` | Restaurants, cafes, bars, bakeries, food trucks | COMMERCE |
| Shopping | `shopping` | Retail stores, boutiques, markets, vintage, gifts | COMMERCE |
| Beauty & Personal Care | `beauty` | Hair salons, barbers, nails, tattoo, spa | COMMERCE, SERVICE_PROVIDER |
| Health & Wellness | `health-wellness` | Gyms, yoga, martial arts, massage, mental health | COMMERCE, SERVICE_PROVIDER, NON_PROFIT |
| Pets | `pets` | Pet grooming, vets, boarding, pet stores | COMMERCE, SERVICE_PROVIDER |
| Home & Auto | `home-auto` | Lawn care, plumbing, electrical, auto repair | COMMERCE, SERVICE_PROVIDER |
| Professional Services | `professional` | Accounting, legal, real estate, tech, photography | COMMERCE, SERVICE_PROVIDER |
| Arts & Culture | `arts-culture` | Galleries, music, comedy, dance, theater | COMMERCE, NON_PROFIT, EVENT |
| Kids & Education | `kids-education` | Schools, tutoring, daycare, camps, youth activities | CIVIC, COMMERCE, NON_PROFIT |
| Community & Faith | `community-faith` | Neighborhood groups, non-profits, churches, mutual aid | ADVOCACY, NON_PROFIT |
| Social Services | `social-services` | Food banks, health clinics, homeless services | NON_PROFIT |
| Government | `government` | Elected officials, city offices, public services | CIVIC |
| Parks | `parks` | Parks, gardens, plazas, outdoor recreation spaces | PUBLIC_SPACE |

---

## How They Work Together

- **Entity Type** = Administrative/structural classification (one per entity)
- **Categories** = User-facing discovery labels (multiple per entity)

### Examples

| Entity | Entity Type | Categories |
|--------|-------------|------------|
| Dance studio | COMMERCE | Arts & Culture, Health & Wellness, Kids & Education |
| Church with food pantry | NON_PROFIT | Community & Faith, Social Services |
| Comedy night at a bar | EVENT | Arts & Culture |
| City councilmember | CIVIC | Government |
| Neighborhood association | ADVOCACY | Community & Faith |

---

## Profile Display by Entity Type

Entity types determine how profiles are rendered on the detail page. The layout and sections shown are configured in `src/lib/entityDisplayConfig.ts`.

| Entity Type | Map Display | Hours Section | Profile Image (if no map) | Notes |
|-------------|-------------|---------------|---------------------------|-------|
| COMMERCE | Yes (if coordinates) | Yes | No | Standard business layout |
| SERVICE_PROVIDER | Yes (if coordinates) | Yes | Yes (if no location) | Home-based services may not have locations |
| CIVIC | Yes (if coordinates) | No | Yes (if no location) | Elected officials typically use profile image |
| PUBLIC_SPACE | Yes (if coordinates) | No | No | Parks/plazas typically always open |
| NON_PROFIT | Yes (if coordinates) | Yes | No | Standard layout |
| EVENT | Yes (if coordinates) | Yes | Yes (if no location) | Events may have varying locations |
| ADVOCACY | Yes (if coordinates) | Yes | No | Standard layout |

**Key Behaviors:**
- **Map vs Profile Image**: Entities without coordinates won't show a map. CIVIC, SERVICE_PROVIDER, and EVENT entities will show a large profile image (from `hero` field) instead when no location is available.
- **Hours Section**: Not displayed for CIVIC (elected officials/offices) and PUBLIC_SPACE (parks are typically always open).
- **Image Display**: The `hero` image is displayed prominently. For entities without maps, it may be shown as a large profile photo (500px for CIVIC, 400px for others).
- **Configuration**: All display rules are configurable in `src/lib/entityDisplayConfig.ts` - see that file to customize layouts per entity type.

---

## Managing Categories

- **Initial setup:** Run `npx prisma db seed` (seeds from `prisma/seed.ts`)
- **After setup:** Use the admin UI at `/admin/categories` to add, edit, or remove categories
- **No hardcoded lists:** Categories are stored in the database, not in code

---

## Tags

Tags provide additional attributes for entities:

### Identity (owner-assigned)
Black-owned, LGBTQ-owned, Women-owned, Veteran-owned, Asian-owned, Latinx-owned, Indigenous-owned

### Friendliness (admin-verified)
Kid-friendly, Dog-friendly, Neurodiversity-friendly, Wheelchair-accessible, Senior-friendly, Sensory-friendly

### Amenities (open)
WiFi, Outdoor Seating, Parking Available, Public Restroom, Accepts Cash, Accepts Cards, Gender-neutral Restrooms, Changing Tables
