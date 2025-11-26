# TahOak Park Collective – Business & Product Requirements
**Version:** 2.3 (FROZEN FOR DEV)
**Status:** Ready for Development
**Last Updated:** November 25, 2025

---

## 1. Overview
**TahOak Park Collective** is a hyper-local discovery platform for residents of **Oak Park** and **Tahoe Park** in Sacramento to find genuinely local businesses, organizations, resources, public spaces, and key recurring community events.

**Core differentiator:** Rather than “what’s closest” or “highest SEO,” TahOak Park Collective prioritizes **real relationships to the neighborhood**:
* Where the owners live.
* Where the activity actually happens.
* Who explicitly focuses on and invests in Oak/Tahoe Park as a community.

**Product type:**
* **Directory / finder tool**
* *Not* a social network
* *Not* a news site
* *Not* a full events calendar
* *Not* a review platform (at least not in MVP)

**Expected scale:**
* **Population served:** ~30k residents (Oak Park + Tahoe Park)
* **Directory size target:** ~50–100 entities for a solid MVP.

---

## 2. Project Context & Constraints
**This is:**
* A **side project** built and maintained by the creator plus a small group of trusted volunteers.
* A **portfolio piece** for **Canopy Digital Services** (demonstrating product, UX, and local hosting capabilities).
* A **local hosting testbed**: self-hosted infrastructure is part of the goal.

**Constraints:**
* Must be **maintainable in spare time** by a handful of admins.
* No pressure for high traffic; the product just needs to be **reliable**.
* **No Monetization** in MVP.

---

## 3. Goals & Non-Goals

### 3.1. Goals
**For residents:**
* Find local places from **people connected to the neighborhood**.
* Discover public spaces (parks, plazas).
* Identify key recurring community events (or major annual traditions).

**For local businesses:**
* A **simple, non-extractive** way to be found without paid ads or social media mastery.
* Signal identity-related attributes (e.g., Black-owned, LGBTQ-owned) and amenities (Kid-friendly).

**For admins/volunteers:**
* Allow **multiple admins**.
* Use a **pending changes queue** to protect data quality.

### 3.2. Non-Goals (Explicitly Out of Scope for MVP)
* **A full events calendar** (Link out to neighborhood associations instead).
* **Neighborhood news/journalism.**
* **Mobile App** (PWA/Website only).
* **Reviews or Ratings** (Avoids moderation toxicity).
* **Listing Chains** (National/Regional chains completely excluded).

---

## 4. Target Users & Key Use Cases

### 4.1. Primary Users
**Residents (“Subscribers & Contributors”)**
* **Status:** Unauthenticated (Guest).
* **Identity:** Identified solely by email address when subscribing or submitting data.
* **Key Capabilities:** Browse (Anonymous), Subscribe (Email verified), Suggest Corrections (Email required).

**Local Owners & Organizers**
* **Status:** Authenticated (Password).
* **Key Capabilities:** Manage profile, upload images, update tags.

**Admins & Volunteers**
* **Status:** Authenticated (Password + Admin Role).
* **Key Capabilities:** Approve/Reject queue, Spot Check data, User management.

---

## 5. Scope & Entity Model

### 5.1. Entity Types
1.  **Business (Brick-and-Mortar):** Physical address in coverage area.
2.  **Service Provider / Freelancer:** Home-based in coverage area, OR freelance provider offered to local clients.
3.  **Nonprofit / Organization:** Mutual aid, community projects.
4.  **Civic / Advocacy:** Neighborhood associations.
5.  **Public Space:** Parks, gardens, plazas.
6.  **Event:** Recurring or Major Annual events only.

### 5.2. Media & Assets
* **Permissions:** Only **Admins** and verified **Owners** may upload images. Residents may not upload photos (to prevent moderation/copyright issues).
* **Limits:** MVP entities are limited to:
    * One (1) Logo / Avatar.
    * One (1) Hero / Cover Image.
* **Rights:** By uploading, Owners grant the platform a license to display the image. Admins may replace owner images with higher-quality or verified safe images (e.g., photos taken by volunteers).

---

## 6. Locality Model & Eligibility
**"Local" is defined by:**
1.  **Presence:** Physically operates in the coverage area (brick-and-mortar address, recurring pop-up location, or resident home-based service).
2.  **Contribution:** Provides life infrastructure, social places, support/equity, or ecosystem support.
3.  **Standards:** Meets community safety/inclusion standards.

**Note:** Inclusion is the primary signal. There are no user-facing "tiers."

---

## 7. Tagging System
1.  **Identity (Owner-assigned):** Black-owned, LGBT-owned, etc.
2.  **Friendliness (Admin-verified):** Kid-friendly, Dog-friendly, Neurodiversity-friendly.
3.  **Amenities (Open):** WiFi, Outdoor Seating.

---

## 8. Operations & Workflows

### 8.1. Data Hygiene (The "Rotator")
* **Spot Checks:** The system MUST generate a weekly **"Spot Check List"** of 3–5 entities for Admins to manually verify (check website/call).
* **Stale Data:** Entities are NOT auto-hidden if owners ignore emails; they are flagged for this manual spot check.

### 8.2. Verification (Hybrid)
* **Claim Form:** MUST include an optional field: *"Reference or Verification Contact"* to allow for manual "sweat equity" verification by admins.

### 8.3. Public Contributions
* **Mechanism:** Public forms for "Suggest Entity" and "Report Issue."
* **Requirement:** Submitter MUST provide a valid email (no anonymous reports).

---

## 9. User Interface & Technical Requirements

### 9.1. Display & Navigation
* **Default Sort:** **Randomized (Shuffle)** to ensure equity.
* **Map View:** The UI MUST provide a **toggle** between "List View" (default) and "Map View" (using Leaflet).
    * *Rationale:* List view is the primary interface to ensure home-based/mobile businesses (which cannot be pinned precisely) are treated with equal weight to storefronts.

### 9.2. Analytics (Privacy-First)
* **Tool:** The system MUST use a self-hosted, privacy-focused analytics tool.
    * *Recommendation:* **Umami** (preferred) or Plausible.
* **Constraint:** NO Google Analytics. NO cookie banners required for analytics.
* **Metrics:** Track unique visitors, page views, and referral sources to validate product usage.

---

## 10. Communication & Legal

### 10.1. Communications
* **Residents:** Double opt-in subscription for updates. Manage preferences via "Magic Link" (no password).
* **Owners:** Transactional emails for account/claims. Periodic maintenance reminders.

### 10.2. "About" & Transparency
The site MUST include an **"About"** page containing:
1.  **Mission:** "Non-extractive, community-first discovery."
2.  **Credits:** "Built by **Canopy Digital Services**" (Portfolio Link) and neighborhood volunteers.
3.  **Inclusion Criteria:** Plain language explanation of why entities are listed (or excluded).
4.  **Feedback:** Link to the General Inquiry / Contact form.

### 10.3. Legal
* **Terms of Use & Privacy Policy:** Must be accessible from footer.
* **Image Rights:** TOU must specify image licensing for owner uploads.