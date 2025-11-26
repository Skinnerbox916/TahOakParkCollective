# Agent Instructions - TahOak Park Collective

## Project Overview

TahOak Park Collective is a business directory platform for local businesses in Tahoe Park, Oak Park, Elmhurst, Colonial Park, and Curtis Park neighborhoods of Sacramento, CA.

**Current Status**: Development environment at `tahoak.skibri.us`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Maps**: React Leaflet
- **Styling**: Tailwind CSS
- **Deployment**: Docker & Docker Compose
- **Password Hashing**: bcrypt (10 salt rounds)

## Project Structure

```
src/
├── app/
│   ├── (admin)/        # Admin routes - requires ADMIN role
│   ├── (portal)/       # Business owner portal - requires BUSINESS_OWNER or ADMIN
│   ├── (public)/       # Public pages (business search)
│   ├── api/            # API routes
│   └── auth/           # Authentication pages
├── components/
│   ├── auth/           # LoginForm, RegisterForm
│   ├── business/       # BusinessCard
│   ├── layout/         # Navbar, Sidebar
│   ├── search/         # BusinessList, BusinessMap, SearchFilters
│   └── ui/             # Reusable UI components
└── lib/
    ├── auth.ts         # Authentication helpers
    ├── password.ts     # Password hashing utilities
    ├── prisma.ts       # Prisma client instance
    └── api-helpers.ts  # API response helpers
```

## Critical Development Setup

### Docker Configuration

**IMPORTANT**: The project uses Docker Compose for development. Key points:

1. **Database Connection**: Always use `tahoak-db` as the hostname (not `localhost`) when connecting from the web container
   - Correct: `postgresql://tahoak:password@tahoak-db:5432/tahoak_db`
   - Wrong: `postgresql://tahoak:password@localhost:5432/tahoak_db`

2. **Volume Mounts**: 
   - `./prisma:/app/prisma` - Mounted so Prisma client can be regenerated
   - `./src`, `./public` - NOT mounted (code is baked into image)
   - `/app/node_modules` and `/app/.next` - Excluded (use container's versions)

3. **Production Mode**: Container runs in production mode (`node server.js`), not dev mode
   - Code changes require rebuilding the image: `docker compose build tahoak-web`
   - Prisma client regenerates on container startup via entrypoint

4. **Environment Variables**:
   - `DATABASE_URL` is hardcoded in docker-compose.yml to use `tahoak-db` hostname
   - `.env` file exists but should NOT override DATABASE_URL for Docker
   - `NEXTAUTH_URL` defaults to `https://tahoak.skibri.us`

### Common Issues and Solutions

#### Issue: Code changes not appearing
**Solution**: Rebuild Docker image - `docker compose build tahoak-web && docker compose up -d tahoak-web`

#### Issue: Prisma connection errors (ECONNREFUSED)
**Solution**: 
- Verify DATABASE_URL uses `tahoak-db` not `localhost`
- Check `.env` file doesn't override with wrong connection string
- Ensure database container is running: `docker compose ps tahoak-db`

#### Issue: Prisma client out of sync
**Solution**: Prisma client regenerates automatically on container startup via entrypoint. If issues persist:
```bash
docker compose exec tahoak-web npx prisma generate
docker compose restart tahoak-web
```

#### Issue: Sign Up button or UI changes not showing
**Solution**: 
- Rebuild image (code is baked in, not mounted)
- Clear browser cache (hard refresh: Ctrl+Shift+R)
- Check reverse proxy cache if using tahoak.skibri.us

## Database

### Connection Details
- **Host**: `tahoak-db` (from web container) or `localhost` (from host)
- **Port**: `5432`
- **Database**: `tahoak_db`
- **User**: `tahoak`
- **Password**: `tahoak_password` (default, change in production)

### Migrations
```bash
# From host machine
DATABASE_URL="postgresql://tahoak:tahoak_password@localhost:5432/tahoak_db" npx prisma migrate dev

# Or from container
docker compose exec tahoak-web npx prisma migrate dev
```

### Seeding
```bash
# From host
DATABASE_URL="postgresql://tahoak:tahoak_password@localhost:5432/tahoak_db" npx tsx prisma/seed.ts

# Test users created:
# - admin@tahoak.com / password123 (ADMIN)
# - owner@tahoak.com / owner123 (BUSINESS_OWNER)
```

## Authentication & Authorization

### User Roles
- `USER`: Default role for new registrations
- `BUSINESS_OWNER`: Can manage their own businesses
- `ADMIN`: Full access, can manage all businesses and users

### Password Security
- Passwords are hashed with bcrypt (10 salt rounds)
- Stored in `User.password` field (nullable for migration support)
- Password utilities in `src/lib/password.ts`

### Route Protection
- **Public**: `/`, `/auth/*`, `/api/auth/*`
- **Business Owner**: `/portal/*` (requires BUSINESS_OWNER or ADMIN)
- **Admin**: `/admin/*` (requires ADMIN only)
- Middleware in `src/middleware.ts` handles route protection

### API Authorization
- Use `withAuth()` wrapper for authenticated endpoints
- Use `withRole([ROLE.ADMIN])` for role-specific endpoints
- Business owners can only modify their own businesses (checked in API)

## API Endpoints

### Public
- `GET /api/businesses` - Search businesses (filters: q, category, status)
- `GET /api/businesses/[id]` - Get single business
- `GET /api/categories` - List all categories

### Authenticated
- `POST /api/auth/register` - Create new user account
- `POST /api/businesses` - Create business (requires auth, defaults to PENDING)
- `PUT /api/businesses/[id]` - Update business (owner or admin only, status change admin only)
- `DELETE /api/businesses/[id]` - Delete business (owner or admin only)

### Business Owner
- `GET /api/business` - Get user's businesses
- `PUT /api/business` - Update user's business

### Admin
- `GET /api/admin/businesses` - Get all businesses (any status)
- `PUT /api/admin/businesses` - Update business status

## Important Patterns

### API Responses
All API routes use helper functions from `src/lib/api-helpers.ts`:
- `createSuccessResponse(data, message?)` - Success response
- `createErrorResponse(error, status?)` - Error response
- `withAuth(handler)` - Require authentication
- `withRole(roles[], handler)` - Require specific role(s)

### Client Components
- All interactive components are marked `"use client"`
- Use `useSession()` from `next-auth/react` for client-side auth
- Use `useSearchParams()` wrapped in Suspense for URL params

### Database Queries
- Always use the Prisma client from `src/lib/prisma.ts`
- Use `include` for relations, `select` for specific fields
- Business status defaults to `PENDING` for new businesses
- Only `ACTIVE` businesses shown in public search (unless status filter specified)

## Development Workflow

### Making Code Changes
1. Edit source files
2. Rebuild Docker image: `docker compose build tahoak-web`
3. Restart container: `docker compose up -d tahoak-web`
4. Wait for "Ready" message in logs
5. Hard refresh browser (Ctrl+Shift+R)

### Database Changes
1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Rebuild image (includes Prisma client generation)
4. Container will regenerate Prisma client on startup

### Testing Locally (Alternative)
If you want hot-reload without Docker:
```bash
# Stop web container
docker compose stop tahoak-web

# Run locally (connects to Docker database)
DATABASE_URL="postgresql://tahoak:tahoak_password@localhost:5432/tahoak_db" npm run dev
```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT encryption secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Base URL of application

### Docker-Specific
- In `docker-compose.yml`, DATABASE_URL is hardcoded to use `tahoak-db` hostname
- `.env` file should NOT override DATABASE_URL for Docker usage
- For local development, `.env` can use `localhost`

## Security Considerations

### Implemented
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Business ownership verification
- ✅ Admin-only status changes
- ✅ Input validation (email format, password length)

### Best Practices
- Never commit `.env` files
- Use strong NEXTAUTH_SECRET in production
- Rotate secrets regularly
- Validate all user inputs
- Check authorization before data modifications

## Common Commands

```bash
# Start services
docker compose up -d

# Rebuild and restart web
docker compose build tahoak-web && docker compose up -d tahoak-web

# View logs
docker compose logs -f tahoak-web

# Database access
docker compose exec tahoak-db psql -U tahoak -d tahoak_db

# Run migrations
DATABASE_URL="postgresql://tahoak:tahoak_password@localhost:5432/tahoak_db" npx prisma migrate dev

# Seed database
DATABASE_URL="postgresql://tahoak:tahoak_password@localhost:5432/tahoak_db" npx tsx prisma/seed.ts

# Generate Prisma client
npx prisma generate
```

## Key Learnings from Development

1. **Docker Volume Mounts**: Production mode doesn't use mounted source code - code is baked into image
2. **Database Hostname**: Always use service name (`tahoak-db`) not `localhost` in Docker
3. **Prisma Client**: Must regenerate when schema changes, happens automatically on container startup
4. **Environment Variables**: `.env` can override docker-compose defaults - be careful with DATABASE_URL
5. **Caching**: Browser and reverse proxy caching can hide UI changes - always hard refresh
6. **Production vs Dev**: Container runs production mode, requires rebuilds for code changes

## Current Features

### Implemented
- ✅ User registration with password hashing
- ✅ User authentication (sign in/out)
- ✅ Business search with filters (category, keyword)
- ✅ Map view with business locations
- ✅ List view with business cards
- ✅ Role-based access control
- ✅ Business CRUD operations (with authorization)
- ✅ Admin business management endpoints

### Placeholder/Incomplete
- ⚠️ Admin dashboard UI (API exists, UI is placeholder)
- ⚠️ Business owner portal UI (API exists, UI is placeholder)
- ⚠️ User management UI
- ⚠️ Individual business detail pages

## Next Steps for Development

1. Build out admin dashboard UI
2. Build out business owner portal UI
3. Add individual business detail pages
4. Implement business image uploads
5. Add email notifications
6. Add password reset functionality

## Notes for Agents

- Always check if you're logged in when testing UI (affects navbar buttons)
- Database connection issues usually mean wrong hostname in DATABASE_URL
- Code changes require Docker rebuild - volume mounts don't work in production mode
- Prisma client auto-regenerates on startup, but may need manual generation if issues persist
- Test at `tahoak.skibri.us` - that's the dev environment
- When in doubt, check container logs: `docker compose logs tahoak-web`

