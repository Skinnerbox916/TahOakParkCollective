# Entity Data Collection Form

Use this form to collect all available information when adding entities to the TahOak Park Collective directory.

---

## Basic Information

### Entity Name *
- **Field:** `name`
- **Required:** Yes
- **Example:** "Joe's Coffee Shop"
- **Notes:** This is the primary display name

### Description
- **Field:** `description`
- **Required:** Yes
- **Example:** "Local coffee shop serving organic, fair-trade coffee and fresh pastries."
- **Notes:** Brief description of what the entity is/does

### Entity Type *
- **Field:** `entityType`
- **Required:** Yes
- **Options:**
  - `COMMERCE` - Businesses and commercial establishments
  - `SERVICE_PROVIDER` - Freelancers, contractors, home-based services
  - `CIVIC` - Government offices, elected officials, public schools
  - `ADVOCACY` - Neighborhood associations, BIDs, community groups
  - `PUBLIC_SPACE` - Parks, libraries, community centers
  - `NON_PROFIT` - Charities, churches, mutual aid organizations
  - `EVENT` - Recurring community events

---

## Contact Information

### Address
- **Field:** `address`
- **Required:** No (but recommended for location-based entities)
- **Example:** "1234 Main Street, Sacramento, CA 95820"
- **Notes:** Full street address. Will be used for geocoding if coordinates not provided.

### Phone
- **Field:** `phone`
- **Required:** No
- **Example:** "(916) 555-1234" or "916-555-1234"
- **Format:** Any format accepted

### Website
- **Field:** `website`
- **Required:** No
- **Example:** "https://www.example.com"
- **Format:** Full URL with http:// or https://

---

## Location

### Latitude
- **Field:** `latitude`
- **Required:** No (but recommended if address is provided)
- **Example:** `38.566111`
- **Notes:** Decimal degrees. Will be auto-calculated from address if not provided.

### Longitude
- **Field:** `longitude`
- **Required:** No (but recommended if address is provided)
- **Example:** `-121.468110`
- **Notes:** Decimal degrees. Will be auto-calculated from address if not provided.

---

## Categories *

### Categories (Multiple Selection)
- **Field:** `categories` (array of category IDs)
- **Required:** Yes (at least one)
- **Available Categories:**
  - Food & Drink (`food-drink`) - Restaurants, cafes, bars, bakeries, food trucks
  - Shopping (`shopping`) - Retail stores, boutiques, markets, vintage, gifts
  - Beauty & Personal Care (`beauty`) - Hair salons, barbers, nails, tattoo, spa
  - Health & Wellness (`health-wellness`) - Gyms, yoga, martial arts, massage, mental health
  - Pets (`pets`) - Pet grooming, vets, boarding, pet stores
  - Home & Auto (`home-auto`) - Lawn care, plumbing, electrical, auto repair
  - Professional Services (`professional`) - Accounting, legal, real estate, tech, photography
  - Arts & Culture (`arts-culture`) - Galleries, music, comedy, dance, theater
  - Kids & Education (`kids-education`) - Schools, tutoring, daycare, camps, youth activities
  - Community & Faith (`community-faith`) - Neighborhood groups, non-profits, churches, mutual aid
  - Social Services (`social-services`) - Food banks, health clinics, homeless services
  - Government (`government`) - Elected officials, city offices, public services
  - Parks & Public Spaces (`parks-public`) - Parks, libraries, community centers, rec facilities
  - Events (`events`) - Recurring community events, markets, meetups

**Notes:** 
- Entities can belong to multiple categories
- Categories must match the entity's Entity Type (see ENTITY_TYPES_AND_CATEGORIES.md for valid combinations)
- Use category slugs when referencing in code, but collect category names when gathering data

---

## Tags

### Identity Tags (Owner-assigned)
- **Field:** `tags` (array)
- **Required:** No
- **Options:**
  - Black-owned
  - LGBTQ-owned
  - Women-owned
  - Veteran-owned
  - Asian-owned
  - Latinx-owned
  - Indigenous-owned
- **Notes:** These are typically self-reported by business owners

### Friendliness Tags (Admin-verified)
- **Field:** `tags` (array)
- **Required:** No
- **Options:**
  - Kid-friendly
  - Dog-friendly
  - Neurodiversity-friendly
  - Wheelchair-accessible
  - Senior-friendly
  - Sensory-friendly
- **Notes:** These should be verified by admin before applying

### Amenity Tags (Open)
- **Field:** `tags` (array)
- **Required:** No
- **Options:**
  - WiFi
  - Outdoor Seating
  - Parking Available
  - Public Restroom
  - Accepts Cash
  - Accepts Cards
  - Gender-neutral Restrooms
  - Changing Tables
- **Notes:** Can be added by anyone, no verification required

---

## Business Hours

### Hours Structure
- **Field:** `hours` (JSON object)
- **Required:** No
- **Format:**
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

**Notes:**
- Time format: `HH:MM` (24-hour format)
- Use `"closed": true` for days the entity is closed
- Days: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`

---

## Social Media Links

### Social Media
- **Field:** `socialMedia` (JSON object)
- **Required:** No
- **Available Platforms:**
  - `facebook` - Facebook page URL
  - `instagram` - Instagram profile URL
  - `twitter` - Twitter/X profile URL
  - `linkedin` - LinkedIn profile URL
  - `yelp` - Yelp business page URL
  - `tiktok` - TikTok profile URL
  - `youtube` - YouTube channel URL
  - `threads` - Threads profile URL

**Example:**
```json
{
  "facebook": "https://www.facebook.com/joescoffeeshop",
  "instagram": "https://www.instagram.com/joescoffee",
  "twitter": "https://twitter.com/joescoffee"
}
```

---

## Images

### Images
- **Field:** `images` (JSON array of URLs)
- **Required:** No
- **Format:** Array of image URLs
- **Example:**
```json
[
  "https://example.com/images/entity-photo-1.jpg",
  "https://example.com/images/entity-photo-2.jpg"
]
```

**Notes:**
- URLs should point to publicly accessible images
- First image is typically used as the primary/featured image
- Recommended: At least one image for better presentation

---

## Administrative Fields

### Status
- **Field:** `status`
- **Required:** No (defaults to `PENDING`)
- **Options:**
  - `ACTIVE` - Visible on public site
  - `PENDING` - Awaiting admin approval
  - `INACTIVE` - Hidden from public site
- **Notes:** Set to `ACTIVE` when entity is ready to be published

### Featured
- **Field:** `featured`
- **Required:** No (defaults to `false`)
- **Options:** `true` or `false`
- **Notes:** Featured entities appear in special sections on the homepage

### Verification Contact
- **Field:** `verificationContact`
- **Required:** No
- **Example:** "owner@example.com" or "916-555-1234"
- **Notes:** Contact info for verifying entity details

---

## Example Completed Form

```markdown
## Basic Information
- **Name:** Joe's Coffee Shop
- **Description:** Local coffee shop serving organic, fair-trade coffee and fresh pastries.
- **Entity Type:** COMMERCE

## Contact Information
- **Address:** 1234 Main Street, Sacramento, CA 95820
- **Phone:** (916) 555-1234
- **Website:** https://www.joescoffee.com

## Location
- **Latitude:** 38.566111
- **Longitude:** -121.468110
- **Coverage Area:** OAK_PARK

## Categories
- Food & Drink
- Shopping (if they sell coffee beans/merchandise)

## Tags
- **Identity:** Black-owned
- **Friendliness:** Kid-friendly, Dog-friendly, Wheelchair-accessible
- **Amenities:** WiFi, Outdoor Seating, Parking Available, Accepts Cash, Accepts Cards

## Business Hours
- Monday-Friday: 7:00 AM - 6:00 PM
- Saturday: 8:00 AM - 5:00 PM
- Sunday: 9:00 AM - 3:00 PM

## Social Media
- Facebook: https://www.facebook.com/joescoffeeshop
- Instagram: https://www.instagram.com/joescoffee

## Images
- Primary photo URL: https://example.com/joes-coffee-exterior.jpg

## Administrative
- **Status:** ACTIVE
- **Featured:** false
```

---

## Data Collection Tips

1. **Start with basics:** Name, Entity Type, and at least one Category are minimum requirements
2. **Location is important:** Address or coordinates help with map display and search
3. **Contact info helps users:** Phone and website are valuable for discovery
4. **Photos improve engagement:** At least one image makes entities more appealing
5. **Hours matter for businesses:** Especially important for retail/service entities
6. **Tags add discoverability:** More tags = better search results
7. **Verify before marking ACTIVE:** Double-check information before publishing

---

## Related Documentation

- [Entity Types and Categories](./ENTITY_TYPES_AND_CATEGORIES.md) - Valid category/entity type combinations
- [Agent Context](./AGENT_CONTEXT.md) - Development guidelines and database structure

