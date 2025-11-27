# Agent Instructions - TahOak Park Collective

> **Start with [AGENT_CONTEXT.md](./AGENT_CONTEXT.md)** — this document is a detailed reference.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Maps**: React Leaflet
- **Styling**: Tailwind CSS
- **Deployment**: Docker & Docker Compose

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/(admin)/   # Admin routes - requires ADMIN role
│   ├── [locale]/(portal)/  # Business owner portal
│   ├── [locale]/(public)/  # Public pages
│   ├── api/                # API routes
│   └── auth/               # Authentication pages
├── components/
│   ├── admin/              # Admin UI components
│   ├── business/           # Business cards, forms
│   ├── entity/             # Entity cards, detail, forms
│   ├── home/               # Homepage components
│   ├── layout/             # Navbar, Footer
│   ├── search/             # Search, filters, map
│   ├── tags/               # Tag badges, selectors
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client
│   ├── api-helpers.ts      # API response helpers
│   └── translations.ts     # i18n helpers
└── types/
    └── index.ts            # TypeScript types
```

---

## Docker Setup

Database hostname from web container: `tahoak-db` (not `localhost`)

```
DATABASE_URL=postgresql://tahoak:tahoak_password@tahoak-db:5432/tahoak_db
```

Volume mounts enable hot reload. Container runs `npm run dev`.

---

## Troubleshooting

### Code changes not appearing
- Check dev server is running: `docker logs tahoak-web --tail 20`
- Restart: `docker restart tahoak-web`
- Hard refresh browser: Ctrl+Shift+R

### Prisma connection errors
- Verify DATABASE_URL uses `tahoak-db` not `localhost`
- Check database container: `docker ps | grep tahoak-db`

### Prisma client out of sync
```bash
docker exec tahoak-web npx prisma generate
docker restart tahoak-web
```

---

## Authentication & Authorization

### Roles
- `USER`: Default for new registrations
- `BUSINESS_OWNER`: Manage own entities
- `ADMIN`: Full access

### Route Protection
- Public: `/`, `/auth/*`
- Business Owner: `/portal/*`
- Admin: `/admin/*`

### API Authorization Helpers
```typescript
withAuth(handler)           // Require login
withRole([ROLE.ADMIN], handler)  // Require specific role
```

---

## API Patterns

### Response Helpers
```typescript
import { createSuccessResponse, createErrorResponse, withAuth, withRole } from "@/lib/api-helpers";

// Success
return createSuccessResponse(data, "Optional message");

// Error
return createErrorResponse("Error message", 400);
```

### Database Queries
- Use Prisma client from `src/lib/prisma.ts`
- Use `include` for relations: `include: { categories: true }`
- Default status filter: `status: BUSINESS_STATUS.ACTIVE`

---

## Key API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/entities` | - | Search entities |
| GET | `/api/entities/[id]` | - | Get single entity |
| GET | `/api/categories` | - | List categories |
| POST | `/api/entities` | ✓ | Create entity |
| PUT | `/api/entities/[id]` | ✓ | Update entity |
| GET | `/api/admin/entities` | Admin | All entities (any status) |

---

## i18n

- Locales: `en`, `es`
- Messages: `src/messages/{locale}.json`
- Use `useTranslations("namespace")` in components
- API uses `getLocaleFromRequest(request)`

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_SECRET` | JWT encryption |
| `NEXTAUTH_URL` | Base URL (`https://tahoak.skibri.us`) |

---

## Current Feature Status

### Implemented
- ✅ Entity search with filters
- ✅ Map and list views
- ✅ Multi-category support
- ✅ Tags (identity, friendliness, amenity)
- ✅ i18n (English/Spanish)
- ✅ Role-based access control
- ✅ Admin entity management

### In Progress / Placeholder
- ⚠️ Business owner portal UI
- ⚠️ Image uploads
- ⚠️ Email notifications
