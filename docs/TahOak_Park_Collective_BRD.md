# TahOak Park Collective - Business Requirements

**Version:** 1.0  
**Last Updated:** November 24, 2025  
**Status:** In Development

---

## 1. Overview

TahOak Park Collective is a hyper-local discovery platform for residents of Sacramento's Oak Park, Tahoe Park, and surrounding neighborhoods to find local businesses, organizations, resources, and community events.

**Core Differentiator:** Prioritizes *local connection* over proximity. Distinguishes between entities that merely exist in the neighborhood versus those genuinely connected to and invested in it.

**Product Type:** Directory/Finder Tool (not a blog, news site, or social network)

**Positioning:** Complementary to Neighborhood Association; helps residents spend locally and engage civically.

---

## 2. Geographic Scope

**Boundaries:**
- North: Highway 50
- South: Fruitridge Road  
- West: Highway 99
- East: 65th Street

**Included Neighborhoods:**
- **Primary:** Oak Park (North/Central/South), Tahoe Park (proper/East/South/West/Tahoe Terrace)
- **Additional:** Colonial Heights, Colonial Manor, Colonial Village, Elmhurst, Tallac Village, Med Center area

---

## 3. Target Users

**Primary:** All residents within geographic boundaries

**User Behaviors:**
- **Hunters:** Have immediate needs, want local options (e.g., "I need a plumber")
- **Gatherers:** Exploring neighborhood, weekend planning (e.g., "What's around here?")

**Secondary:** Business owners (owner portal), administrators

---

## 4. Core Problems & Value Proposition

**Problems:**
1. Residents want to spend locally but don't know where
2. Want civic engagement but don't know what's available  
3. Unclear if spending supports neighborhood
4. Existing platforms don't distinguish local vs. chain

**Solution:**
- Curated for local connection, not just proximity
- Excludes national chains
- Includes non-commercial entities (civic, advocacy, resources, events)
- Locality tagging (framework TBD)

---

## 5. Entity Categories

**Top-Level Categories:**
1. Commerce
2. Civic
3. Advocacy
4. Public Space
5. Non-Profit
6. Community Events

**Commerce Subcategories (known):** Retail, Services, Food & Drink
**Status:** Commerce subcategories need expansion; rest TBD

---

## 6. Entity Types & Profile Requirements

Different entity types have different profile requirements:

### Storefronts & Restaurants
- Address, phone, map, hours, website/social, description, photos, tags, locality indicators

### Service Professionals (home-based)
- Phone, website/social, description, tags, locality indicators
- **NO address or map** (privacy - don't want people at their house)

### Public Spaces
- Name, address, map, description, amenities, city contact info, hours, photos
- List of Community Events held at location

### Civic/Advocacy Organizations
- Name, contact, description/mission, website/social, participation info, meeting info
- List of Community Events organized

### Community Events
- Name, description, schedule/frequency, location (mapped if consistent), organizer contact, website link
- Links to venue (Public Space) and organizer (Civic/Non-Profit)
- Optional: seasonal info, vendors/participants, photos
- Disclaimer: "Schedule may vary - check with organizer"

**Event Inclusion Criteria:**
- Recurring (weekly/monthly/regular)
- Demonstrated longevity
- Predictable schedule
- General community appeal

**Examples:** Tahoe Park Food Trucks, Oak Park Farmers Market, First Fridays, Day of the Dead

**Future:** Meetup/interest groups (cosplay, kickball, book clubs)

### Locality Tagging

**Status:** Framework in development

**Known:** "Owner lives in neighborhood" tag; additional indicators TBD

**Exclusion:** National chains not listed

---

## 7. Core Functionality

### Search & Browse
- Text search across entities
- Category filtering
- Entity type/subcategory filtering
- Map view with markers
- Card-based results display

**Map Placement:** TBD (main page vs. one level deep)

### Entity Profiles
- Dynamic fields based on entity type
- Contact info, description, photos, links
- Category tags, locality indicators

### Featured Entity
- Highlighted on homepage
- Admin-selected, rotates weekly (flexible)
- Quality imagery, full profile link

---

## 8. Portals & Administration

### Owner Portal
- Owner authentication
- Claim entity profile
- Edit profile (info, photos, hours)
- Admin reviews changes before publishing

### Admin Portal
- Admin authentication
- Create/edit any entity
- Approve owner claims and edits
- Set Featured Entity
- Manage categories/tags
- Review community submissions

---

## 9. Community Contributions

### Report an Issue
- Available on all entity profiles
- Anonymous submission (email optional for follow-up)
- Issue types: broken link, incorrect hours/contact/address/location, business closed, other
- Routes to admin review queue
- Admin investigates, corrects, or dismisses

### Suggest an Addition
- Accessible from multiple locations (header, empty results, footer)
- Anonymous submission (email optional)
- Fields: entity name, type/category, reason for inclusion, address, website, relationship to entity
- **If relationship = "I own/operate":** Direct to Owner Portal
- Routes to admin review queue
- Admin evaluates against inclusion criteria, approves or rejects

### Moderation
- Admin approval required for all changes
- Moderation handled by small team (admin + select volunteers)
- No spam prevention initially (add if needed)
- Optional: Email confirmations and status updates

**Future:** Photo submissions, edit suggestions, activity feed, community contributor recognition

---

## 10. Data Management

### Initial Population
- Scraping + manual entry by admin
- Direct work with select businesses for quality data
- Owner portal rollout for self-service

### Ongoing Maintenance
- Owners update their profiles
- Community reports issues/suggests additions
- Admin verifies, approves, maintains quality
- Remove closed businesses
- Curate Featured Entity

---

## 11. Open Questions

### Immediate Priority
1. **Category System:** Finalize categories, develop Commerce subcategories
2. **Locality Tagging:** Define full framework and verification process
3. **Map Placement:** Main page vs. one level deep?
4. **Terminology:** Consistent language for "entities" across site (not just "businesses")

### Medium Priority
5. **Search Enhancement:** Improve for complex queries, synonyms
6. **Featured Entity:** Enhanced layout/curated content
7. **Community Features:** Reviews? Events calendar? Neighborhood news?
8. **Monetization:** Free for users? Premium business features?

### Long-Term
9. **Expansion:** Adjacent neighborhoods? Other cities?
10. **Advanced Features:** Mobile app, personalization, API
11. **Partnerships:** Neighborhood Association, local media, city government

---

**Document History:**
- v1.0 (2025-11-24): Streamlined business requirements document
- Previous: v0.1-0.4 included extensive implementation details, user flows, technical specs
