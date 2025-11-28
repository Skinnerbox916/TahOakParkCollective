# Entity Addition Runbook (AI Agent)

> **Purpose:** Step-by-step guide for AI agents to add entities to TahOak Park Collective using direct database insertion.

## Prerequisites

Before starting, ensure you have:
- Access to Docker containers (`tahoak-db`, `tahoak-web`)
- Reference to [ENTITY_DATA_COLLECTION_FORM.md](./ENTITY_DATA_COLLECTION_FORM.md) for field definitions
- Reference to [AGENT_CONTEXT.md](./AGENT_CONTEXT.md) for database structure

---

## Step 1: Research & Data Collection

### 1.1 Receive Entity Name
- User provides entity name (e.g., "Sac City Brews")
- **Important:** The user-provided name is unverified. Always use the official name obtained from research in Step 1.2, not the user-provided name.
- Confirm location/area if not clear

### 1.2 Research Entity
Use web search to gather:
- **Basic Info:** Name, description, entity type
- **Contact:** Address, phone, website
- **Location:** Address (required for physical locations)
- **Categories:** What categories apply (use category names, not IDs yet)
  - **⚠️ Important:** If the entity doesn't fit neatly into any existing categories, **STOP** and ask the user for guidance before proceeding. Do not force-fit entities into inappropriate categories.
- **Tags:** Identity, friendliness, amenity tags that apply
- **Hours:** Business hours (convert to 24-hour format) - Note: For gyms, dance studios, yoga studios, fitness classes, and similar entities with class schedules, skip hours and note "Visit website for current class schedules and hours" in description. For schools and other entities with standard operating hours, use NULL if hours are not readily available.
- **Social Media:** Facebook, Instagram, Twitter, etc. (optional - use NULL if not found)
- **Images:** Public image URLs (optional)

### 1.2.1 Get Exact Coordinates (if needed)
**Determine if coordinates are required:**
- **Required:** Storefronts, parks, public spaces, physical locations people visit
- **Not required:** Mobile services, home-based businesses, freelancers without physical locations
- **Special case - CIVIC entities:** Elected officials and government offices may not have locations in the coverage area. For these entities, provide a hero image instead - it will be displayed as a large profile photo (see Profile Display Note below)

**If coordinates are required:**
1. Use Nominatim (OpenStreetMap) to geocode the address - this matches the system's geocoding utility:
   ```bash
   # Example: Geocode an address
   ADDRESS="3501 59th Street, Sacramento, CA 95820"
   curl -s -H "User-Agent: TahOakParkCollective/1.0" \
     "https://nominatim.openstreetmap.org/search?q=$(echo "$ADDRESS" | jq -sRr @uri)&format=json&limit=1" | \
     jq -r 'if .[0] then "\(.[0].lat),\(.[0].lon)" else "null" end'
   ```
2. **If geocoding succeeds:** Use the exact coordinates in the INSERT (Step 5.1)
3. **If geocoding fails:** Leave coordinates as `NULL` (entity won't appear on map, but will appear in list view)

**Important:** 
- Do NOT use approximate/estimated coordinates
- Rate limit: 1 request per second (add `sleep 1` if geocoding multiple entities)
- If exact coordinates cannot be obtained, use `NULL` - the system handles this gracefully
- The map component filters out entities without coordinates automatically
- Coordinates should be within the TahOak Park Collective coverage area (the map will only display entities within the boundary polygon)

**Profile Display Note:**
- Entities without coordinates won't show a map on their profile page
- **CIVIC entities** (elected officials) without coordinates will display a large profile image (from `hero` field) instead of a map - ensure a hero image is provided
- **SERVICE_PROVIDER** and **EVENT** entities without coordinates may also show profile images
- **Hours section** is not displayed for CIVIC and PUBLIC_SPACE entity types
- See [ENTITY_TYPES_AND_CATEGORIES.md](./ENTITY_TYPES_AND_CATEGORIES.md) for full profile display behavior by entity type

### 1.3 Collect Translations (Optional but Recommended)

**For Spanish-speaking community members, provide Spanish translations:**

- **Name Translation:** Spanish version of the entity name
- **Description Translation:** Spanish version of the description

**Format:** JSON object with `en` and `es` keys:
```json
{
  "en": "English text",
  "es": "Spanish text"
}
```

**When to translate:**
- ✅ **Always translate:** Entity names (especially if they have Spanish names or are well-known in Spanish)
- ✅ **Recommended:** Descriptions for community-facing entities
- ⚠️ **Optional:** If translation isn't available, the system will fall back to English

**Examples:**
- Entity name: `{"en": "Sac City Brews", "es": "Sac City Brews"}` (same in both languages)
- Entity name: `{"en": "Tahoe Park", "es": "Parque Tahoe"}`
- Description: `{"en": "Local brewery...", "es": "Cervecería local..."}`

**Note:** If translations are not provided, set to `NULL`. The system will use the English `name` and `description` fields as fallbacks.

### 1.4 Validate Data Against Form
Cross-reference collected data with [ENTITY_DATA_COLLECTION_FORM.md](./ENTITY_DATA_COLLECTION_FORM.md):
- ✅ Name (required)
- ✅ Description (required)
- ✅ Entity Type (required - one of: COMMERCE, SERVICE_PROVIDER, CIVIC, ADVOCACY, PUBLIC_SPACE, NON_PROFIT, EVENT)
- ✅ At least one Category (required)
- ⚠️ Address (recommended)
- ⚠️ Phone (optional)
- ⚠️ Website (optional)
- ⚠️ Latitude/Longitude (required for physical locations people visit, NULL for mobile/home-based services)
- ⚠️ Name Translations (optional but recommended - Spanish for community-facing entities)
- ⚠️ Description Translations (optional but recommended - Spanish for community-facing entities)
- ⚠️ Tags (optional)
- ⚠️ Hours (optional - not displayed for CIVIC/PUBLIC_SPACE)
- ⚠️ Social Media (optional)

### 1.5 Check for Duplicate Entities

**After completing research, you will be provided with a list of existing entities in the database.** Compare the entity you researched against this list to determine if it's a duplicate.

**Comparison Criteria (use your judgment):**
- **Name similarity:** Consider variations, abbreviations, and common name differences (e.g., "Oak Park Community Center" vs "Oak Park Community Center at MLK Park")
- **Address matching:** Check if the address corresponds to the same physical location (handle variations in address formats)
- **Website matching:** Compare website URLs (account for variations in protocol, www, trailing slashes)
- **Overall entity identity:** Consider all factors together to determine if entities represent the same business/organization

**Decision Making:**
- Return `isDuplicate: true` if you are confident the researched entity is the same as an existing one
- Include the existing entity's name in the response: `existingEntityName: "Existing Entity Name"`
- Use your judgment to handle edge cases (e.g., same name but different location = not duplicate; same location but different name = likely duplicate)
- If uncertain, err on the side of `isDuplicate: false` - manual review will catch edge cases

**Important:** Only mark as duplicate if you are confident it's the same entity. Different branches, franchises at different locations, or similar names for different entities should NOT be marked as duplicates.

### 1.6 Validate Coverage Area

**After duplicate checking, if an address was found:**
- The system will automatically geocode the address
- It will verify the location is within the TahOak Park Collective coverage area (Tahoe Park, Oak Park, Elmhurst, Colonial Park, Curtis Park neighborhoods)
- **If outside coverage area:** Entity addition will be rejected with an error message
- **If no address:** The system assumes the entity is in the coverage area (for mobile services, home-based businesses, etc.)

**Coverage area boundaries:**
- The system uses a polygon boundary to validate locations
- Only entities within this boundary will be accepted
- This ensures all entities are genuinely local to the covered neighborhoods

---

## Step 2: Database Lookups

### 2.1 Get Admin User ID
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT id, email FROM \"User\" WHERE email = 'admin@tahoak.com';"
```
**Save the ID** - you'll need it for `ownerId` field.

### 2.2 Get Category IDs
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT id, name, slug FROM \"Category\" ORDER BY name;"
```
**Map category names to IDs** (e.g., "Food & Drink" → `cmiht14on0000t0nzkbtyl473`)

**⚠️ Stop Condition:** If you cannot find appropriate existing categories that match the entity you researched, **STOP** and ask the user:
- Should a new category be created?
- Should the entity be added to the closest existing category (and which one)?
- Should the entity addition be postponed until categories are reviewed?

Do not proceed with entity insertion if you cannot confidently map it to at least one appropriate existing category.

### 2.3 Get Tag IDs (if tags will be added)
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT id, name, slug, category FROM \"Tag\" ORDER BY category, name;"
```
**Map tag names to IDs** (e.g., "Kid-friendly" → `cmiht14zk000mt0nzpvkgnwp1`)

---

## Step 3: Generate Slug

Create URL-friendly slug from entity name:
- Convert to lowercase
- Replace spaces/special chars with hyphens
- Remove leading/trailing hyphens
- Example: "Sac City Brews" → `sac-city-brews`

**Check for uniqueness:**
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "SELECT slug FROM \"Entity\" WHERE slug = 'your-slug-here';"
```
If exists, append `-1`, `-2`, etc.

---

## Step 4: Format Data for Insertion

**⚠️ Important: SQL Escaping**
Before inserting text fields into SQL, escape any single quotes by doubling them (`''`). This applies to:
- The `description` field and any other text fields that may contain apostrophes
- Translation JSON objects (both in `nameTranslations` and `descriptionTranslations`)

Examples:
- `Kids' Classes` → `Kids'' Classes`
- `Owner's Choice` → `Owner''s Choice`
- `They're open` → `They''re open`
- Translation JSON: `{"en": "Owner's Choice", "es": "Elección del Propietario"}` → `'{"en": "Owner''s Choice", "es": "Elección del Propietario"}'::jsonb`

This will be applied when building the INSERT statement in Step 5.1.

### 4.1 Format Hours JSON
Convert business hours to JSON format:
```json
{
  "monday": { "open": "09:00", "close": "17:00", "closed": false },
  "tuesday": { "open": "09:00", "close": "17:00", "closed": false },
  "wednesday": { "open": "09:00", "close": "17:00", "closed": false },
  "thursday": { "open": "09:00", "close": "17:00", "closed": false },
  "friday": { "open": "09:00", "close": "17:00", "closed": false },
  "saturday": { "open": "10:00", "close": "16:00", "closed": false },
  "sunday": { "closed": true }
}
```
- Use 24-hour format (`HH:MM`)
- Use `"closed": true` for closed days
- Omit `open`/`close` when `closed: true`

**Note:** 
- For entities with class schedules or varying hours (gyms, dance studios, yoga studios, fitness classes, personal trainers), leave `hours` as `NULL` and add a note in the description directing users to the website for current schedules/hours. Use clear, user-friendly messaging such as: "See website for current class schedules and hours" or "Please visit our website for current schedules."
- For schools and other entities with standard operating hours, use `NULL` if hours are not readily available - no special note needed in the description.
- **Important:** Hours are not displayed for CIVIC and PUBLIC_SPACE entity types. Don't add hours data for these entity types.

### 4.2 Format Social Media JSON
```json
{
  "facebook": "https://www.facebook.com/example",
  "instagram": "https://www.instagram.com/example",
  "twitter": "https://twitter.com/example"
}
```
- Only include platforms with URLs
- Use full URLs with `https://`

### 4.3 Format Images JSON (if applicable)
```json
{
  "hero": "https://example.com/storefront-photo.jpg",
  "logo": "https://example.com/logo.png"
}
```
- `hero`: Cover/featured image (displayed prominently, or as profile photo for CIVIC entities without coordinates)
- `logo`: Logo/avatar image (displayed smaller, typically in cards)
- Both fields are optional, but at least one image (preferably hero) is recommended

---

## Step 5: Insert Entity

### 5.1 Insert Main Entity Record
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "
INSERT INTO \"Entity\" (
  id, name, slug, description, 
  \"nameTranslations\", \"descriptionTranslations\",
  address, phone, website,
  latitude, longitude, \"entityType\", status, featured,
  \"ownerId\", hours, \"socialMedia\", images,
  \"createdAt\", \"updatedAt\"
) VALUES (
  gen_random_uuid()::text,
  'Entity Name',  -- English (required, used as fallback)
  'entity-slug',
  'Description text here',  -- English (required, used as fallback)
  '{\"en\": \"Entity Name\", \"es\": \"Nombre de Entidad\"}'::jsonb,  -- Translations (optional)
  '{\"en\": \"Description text here\", \"es\": \"Texto de descripción aquí\"}'::jsonb,  -- Translations (optional)
  '123 Main St, Sacramento, CA 95820',
  '(916) 555-1234',
  'https://www.example.com',
  38.566111,
  -121.468110,
  'COMMERCE',
  'ACTIVE',
  false,
  'ADMIN_USER_ID_HERE',
  '{\"monday\": {\"closed\": true}, ...}'::jsonb,
  '{\"facebook\": \"https://...\", ...}'::jsonb,
  NULL,
  NOW(),
  NOW()
) RETURNING id, name, slug;
"
```

**Translation Fields:**
- `nameTranslations` and `descriptionTranslations` are optional - set to `NULL` if translations are not available
- If provided, must be valid JSON with `en` and `es` keys
- The system will fall back to the `name` and `description` fields if translations are missing or incomplete
- **SQL Escaping:** Remember to escape single quotes in translation JSON (e.g., `Owner's` → `Owner''s`)

**Important fields:**
- `id`: Use `gen_random_uuid()::text`
- `status`: Use `'ACTIVE'` for ready-to-publish entities
- `featured`: Use `false` (can be updated later)
- `ownerId`: Use admin user ID from Step 2.1
- `hours`: JSONB format (use `::jsonb` cast) or `NULL` if not applicable
- `socialMedia`: JSONB format (use `::jsonb` cast) or `NULL` if not found
- `images`: JSONB array or `NULL`
- `spotCheckDate`: `NULL` (optional field)
- `verificationContact`: `NULL` (optional field)

**SQL Escaping (Required):** Before inserting, ensure any single quotes/apostrophes in text fields (especially `description`) are escaped by doubling them (`''`). See Step 4 for details and examples. Failure to escape single quotes will cause the SQL INSERT to fail.

**Save the returned entity ID** for next steps.

### 5.2 Link Categories

You can link categories individually or in a single batch INSERT. **For multiple categories, use the batch INSERT option (Option 2) for better efficiency.**

**Option 1: Individual INSERT (one category at a time)**
Use this when linking a single category:
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "
INSERT INTO \"_CategoryToEntity\" (\"A\", \"B\")
VALUES ('CATEGORY_ID', 'ENTITY_ID');
"
```

**Option 2: Batch INSERT (recommended for multiple categories)**
Use this when linking two or more categories to the same entity:
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "
INSERT INTO \"_CategoryToEntity\" (\"A\", \"B\")
VALUES 
  ('CATEGORY_ID_1', 'ENTITY_ID'),
  ('CATEGORY_ID_2', 'ENTITY_ID'),
  ('CATEGORY_ID_3', 'ENTITY_ID');
"
```

**Field mapping:**
- `A` = Category ID
- `B` = Entity ID (same for all rows when linking multiple categories)

**Recommendation:** Use batch INSERT when linking multiple categories to reduce the number of database operations and improve efficiency.

### 5.3 Add Tags
For each tag:
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "
INSERT INTO \"EntityTag\" (id, \"entityId\", \"tagId\", verified, \"createdBy\", \"createdAt\")
VALUES (
  gen_random_uuid()::text,
  'ENTITY_ID',
  'TAG_ID',
  true,
  'ADMIN_USER_ID',
  NOW()
);
"
```
- `verified`: Use `true` for admin-added tags (FRIENDLINESS tags should be verified)
- `createdBy`: Use admin user ID

---

## Step 6: Regenerate Prisma Client

**CRITICAL:** After direct SQL insertion, regenerate Prisma client:
```bash
docker exec tahoak-web npx prisma generate
docker restart tahoak-web
```

This ensures the Prisma client is in sync with the database schema.

---

## Step 7: Verification Queries

### 7.1 Verify Entity Created
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "
SELECT 
  e.id, e.name, e.slug, e.status, e.\"entityType\",
  (SELECT COUNT(*) FROM \"_CategoryToEntity\" WHERE \"B\" = e.id) as category_count,
  (SELECT COUNT(*) FROM \"EntityTag\" WHERE \"entityId\" = e.id) as tag_count
FROM \"Entity\" e
WHERE e.slug = 'entity-slug';
"
```

### 7.2 Verify Categories Linked
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "
SELECT c.name 
FROM \"Category\" c
INNER JOIN \"_CategoryToEntity\" ce ON c.id = ce.\"A\"
WHERE ce.\"B\" = 'ENTITY_ID';
"
```

### 7.3 Verify Tags Added
```bash
docker exec tahoak-db psql -U tahoak -d tahoak_db -c "
SELECT t.name, t.category, et.verified
FROM \"Tag\" t
INNER JOIN \"EntityTag\" et ON t.id = et.\"tagId\"
WHERE et.\"entityId\" = 'ENTITY_ID'
ORDER BY t.category, t.name;
"
```

---

## Step 8: Handoff to User for UAT

After completing all database operations, provide the user with:

### Summary of What Was Added
- Entity name and slug
- Entity ID
- Categories linked
- Tags added
- Status (should be ACTIVE)

### UAT Instructions for User

**Please verify the following:**

1. **Search Page**
   - Navigate to the search page
   - Search for the entity by name
   - Verify entity appears in results
   - Check that all categories display correctly
   - Verify tags are visible

2. **Entity Detail Page**
   - Click through to the entity detail page
   - Verify all information displays correctly:
     - Name, description
     - Address, phone, website
     - Business hours (if provided)
     - Social media links (if provided)
     - Categories and tags
   - Check that map displays correctly (if coordinates provided)

3. **Language Switching**
   - Switch to Spanish (ES) locale
   - Verify entity information displays
   - Note: Tags may show in English if Spanish translations are missing (this is a known issue, separate from entity addition)

4. **Homepage**
   - Check if entity appears in category listings
   - Verify featured status (if applicable)

**If you find any issues:**
- Note the specific problem
- Provide the entity slug or ID
- I can investigate and fix

**If everything looks good:**
- Entity is ready and live on the site!

---

## Quick Reference: Common Values

### Entity Types
- `COMMERCE`
- `SERVICE_PROVIDER`
- `CIVIC`
- `ADVOCACY`
- `PUBLIC_SPACE`
- `NON_PROFIT`
- `EVENT`

### Status Values
- `ACTIVE` - Visible on public site
- `PENDING` - Awaiting approval
- `INACTIVE` - Hidden from public

---

## Troubleshooting

### Issue: Prisma Client Out of Sync
**Symptom:** "Column does not exist" errors after insertion
**Fix:** Run Step 6 (regenerate Prisma client)

### Issue: Entity Not Appearing
**Check:**
- Status is `ACTIVE` (not `PENDING`)
- At least one category is linked
- Prisma client was regenerated

### Issue: Tags Not Showing
**Check:**
- Tags were inserted into `EntityTag` table
- Tag IDs are correct
- Entity ID matches in `EntityTag.entityId`

---

## Related Documentation

- [ENTITY_DATA_COLLECTION_FORM.md](./ENTITY_DATA_COLLECTION_FORM.md) - Field definitions and examples
- [AGENT_CONTEXT.md](./AGENT_CONTEXT.md) - Database structure and commands
- [ENTITY_TYPES_AND_CATEGORIES.md](./ENTITY_TYPES_AND_CATEGORIES.md) - Valid category/entity type combinations

