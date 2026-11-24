# TahOak Park Collective

A hyper-local directory platform for Tahoe Park, Oak Park, Elmhurst, Colonial Park, and Curtis Park neighborhoods of Sacramento, CA. Fully bilingual (English/Spanish).

## Features

- **Public Directory**: Search and browse local entities with map and list views
- **Owner Portal**: People who manage a listing (claimed or added by them) propose changes for admin review
- **Admin Dashboard**: Administrators manage entities, users, and approve listings
- **Bilingual**: Full English/Spanish support with auto-translation
- **Authentication**: Passkeys, passwords (breached ones rejected), emailed codes and authenticator-app 2FA via Better Auth
- **Map Integration**: Interactive maps showing entity locations using Leaflet

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Maps**: React Leaflet
- **Styling**: Tailwind CSS
- **i18n**: next-intl (English/Spanish)
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for database)
- PostgreSQL 16+ (if running database locally without Docker)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TahOakParkCollective
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set the following required variables:

```env
# Database Configuration
DATABASE_URL=postgresql://tahoak:your_password@localhost:5432/tahoak_db

# Auth (Better Auth)
# Generate a secure secret: openssl rand -base64 32
BETTER_AUTH_SECRET=your_secure_random_string_here
BETTER_AUTH_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

**Important Security Notes:**
- Never commit `.env` files to version control
- Use strong, unique passwords for production
- Generate a secure `BETTER_AUTH_SECRET` using: `openssl rand -base64 32`
- Use different credentials for development and production

### 4. Start the Database

Using Docker Compose (recommended):

```bash
docker compose up -d tahoak-db
```

The database will be available at `localhost:5432`.

### 5. Run Database Migrations

```bash
npm run db:migrate
```

This will create all necessary database tables and apply migrations.

### 6. Seed the Database (Optional)

Populate the database with sample data including test users:

```bash
npm run db:seed
```

This creates:
- 13 entity categories and the default tags
- Admin user `admin@tahoak.com`, only if it doesn't exist yet. Its password comes from `SEED_ADMIN_PASSWORD`; if that's unset, a random password is generated and printed once. Re-running the seed never changes an existing admin's password.
- Test user `owner@tahoak.com` / `owner123`, only when `SEED_TEST_USERS=true` (local development only). It manages nothing until you add it to a listing (admin entity page, Members) or it claims one

For local development, set these in `.env` to get the usual test logins:

```bash
SEED_ADMIN_PASSWORD=password123
SEED_TEST_USERS=true
```

**Warning**: Never set `SEED_TEST_USERS` or a guessable `SEED_ADMIN_PASSWORD` in production.

### 7. Generate Prisma Client

```bash
npm run db:generate
```

### 8. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Signs session cookies (32+ characters) | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public origin of the site. Passkeys are bound to this host | `http://localhost:3000` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Outgoing mail (required in production; unset in dev prints emails to the log) | `smtp.migadu.com`, `465` |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Sender and reply-to for every email | `"TahOak Park Collective <tahoak@canopyds.com>"` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `development` |
| `APP_NAME` | Brand in emails, passkey prompts and authenticator apps | `TahOak Park Collective` |
| `POSTGRES_USER` | PostgreSQL username | `tahoak` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `tahoak_password` |
| `POSTGRES_DB` | PostgreSQL database name | `tahoak_db` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `DEEPL_API_KEY` | DeepL API key for auto-translation. Required in production for the translate buttons; dev falls back to a mock that prefixes `[ES] ` | - |
| `UPLOAD_DIR` | Where uploaded images are stored, served at `/uploads/...`. In production, mount a persistent volume here or uploads are lost on redeploy | `<cwd>/uploads` (`/app/uploads` in the Docker image) |
| `SKIP_MIGRATIONS` | Set to `true` to stop the Docker image from running `prisma migrate deploy` on start | `false` |

## Database Management

### Running Migrations

Create a new migration:
```bash
npm run db:migrate
```

### Seeding the Database

```bash
npm run db:seed
```

### Database Schema

The schema is defined in `prisma/schema.prisma`. Key models:

- **User**: Application users with roles (USER, ADMIN)
- **EntityMember**: Who manages a listing (OWNER or MANAGER); none means unclaimed
- **Entity**: Directory listings with location, categories, and status
- **Category**: Entity categories
- **Tag**: Identity, friendliness, and amenity tags
- **AuthSession/AuthAccount/AuthVerification/Passkey/TwoFactor**: Better Auth tables (sessions, password hashes, codes, passkeys, authenticator secrets)

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seed script
│   └── migrations/         # Database migrations
├── src/
│   ├── app/
│   │   ├── [locale]/(admin)/   # Admin routes (ADMIN role)
│   │   ├── [locale]/(portal)/  # Portal for people who manage listings
│   │   ├── [locale]/(public)/  # Public pages
│   │   └── api/                # API routes
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   ├── messages/           # Translation files (en.json, es.json)
│   ├── i18n/               # i18n configuration
│   └── types/              # TypeScript types
├── docs/                   # Project documentation
├── .env.example            # Environment variables template
├── docker-compose.yml      # Docker services configuration
└── README.md               # This file
```

## Security

### Authentication

- Passwords are hashed with scrypt (accounts from before Better Auth keep bcrypt until their next sign-in) and checked against known breaches (Have I Been Pwned)
- Database sessions (30 days); role changes, bans and sign-outs apply on the next request
- Admin tools need a session that signed in with a passkey or password + authenticator code
- Role-based access control (RBAC)

### Authorization

- **Public Routes**: Entity search and listings
- **Portal Routes**: `/portal/*` - Any signed-in user; they see the listings they're a member of
- **Admin Routes**: `/admin/*` - Requires ADMIN role

### API Security

- Entity update/delete endpoints require authentication
- Members can only propose changes to their own listings; every change except an admin's waits for approval
- Only admins can change entity status directly (members can request removal)
- All API endpoints validate user permissions

### Best Practices

1. **Never commit secrets**: Use `.env` files (already in `.gitignore`)
2. **Use strong passwords**: Generate secure random strings for production
3. **Rotating `BETTER_AUTH_SECRET` needs care**: it signs session cookies *and* encrypts authenticator-app secrets. Replacing it outright signs everyone out and breaks every enrolled authenticator app. To rotate, use Better Auth's `BETTER_AUTH_SECRETS` (old and new secrets together) as described in its docs.
4. **Use HTTPS in production**: Always use secure connections
5. **Review dependencies**: Regularly update packages for security patches

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed the database
npm run db:generate  # Generate Prisma Client
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling

## Testing

### Test Credentials (Development Only)

After seeding the database:

- **Admin**: `admin@tahoak.com` / `password123`
- **Test user**: `owner@tahoak.com` / `owner123` (manages nothing until added to a listing)

**Warning**: These are test credentials. Never use them in production!

## Deployment

### Production Checklist

- [ ] Set strong, unique `BETTER_AUTH_SECRET`
- [ ] Use secure database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `BETTER_AUTH_URL` (HTTPS) and the SMTP variables
- [ ] Set up database backups
- [ ] Configure environment variables in hosting platform
- [ ] Review and update all dependencies
- [ ] Set up monitoring and error tracking
- [ ] Configure CORS and security headers
- [ ] Set up SSL/TLS certificates

### CI and Production Deploys

Production runs on Coolify, and every merge to `main` deploys automatically. GitHub Actions (`.github/workflows/ci.yml`) runs on every PR and on `main`:

- applies all migrations to an empty Postgres and checks they match `prisma/schema.prisma`
- `tsc --noEmit`, `npm run lint` and `npm run build`
- builds the production image and boots it until `/api/health` responds

The production image applies pending migrations on start (`docker-entrypoint.sh`), so you don't need to run them by hand. The old container keeps serving while the new one migrates, so a migration must still work with the code that's currently deployed. For example, add a column in one deploy and drop the old one in a later deploy. The image's `HEALTHCHECK` calls `/api/health`, which queries the database. A container whose migration fails exits, never turns healthy, and Coolify keeps the previous one running.

The seed script is not run automatically. Run it by hand only on a fresh database.

### Docker Deployment

The project includes Docker configuration:

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check if database container is running: `docker compose ps`
- Ensure database is accessible: `docker compose exec tahoak-db psql -U tahoak -d tahoak_db`

### Migration Issues

- Ensure database is running before migrations
- Check Prisma Client is generated: `npm run db:generate`
- Review migration files in `prisma/migrations/`

### Authentication Issues

- Verify `BETTER_AUTH_SECRET` is set
- Check `BETTER_AUTH_URL` matches the URL in the browser exactly (passkeys fail on any other host)
- In development, sign-in and verification codes are printed by `docker logs tahoak-web`

### Admin locked out (lost every passkey and authenticator)

Admin tools need a session that signed in with a passkey or a password plus authenticator code. If an admin has lost all of them, remove them in the production database (Coolify's Postgres container), then sign in with the password or an emailed code and set up a new one in Account:

```sql
DELETE FROM "Passkey" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'admin@example.com');
DELETE FROM "TwoFactor" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'admin@example.com');
UPDATE "User" SET "twoFactorEnabled" = false WHERE email = 'admin@example.com';
```

### Moving to a new domain

Passkeys belong to the domain they were created on. After changing `BETTER_AUTH_URL` to a new domain, existing passkeys stop working there; people sign in with their password or an emailed code and add a new passkey. (WebAuthn "related origins" can bridge the two domains if needed.)
- Ensure user passwords are properly hashed in database

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## License

See LICENSE file for details.

## Documentation

For LLM coding agents working on this project, see [docs/AGENT_CONTEXT.md](./docs/AGENT_CONTEXT.md) for:
- Development context and conventions
- Entity model and categories
- Docker commands
- API patterns and authentication
- Translation system overview

## Support

For issues and questions, please open an issue on the repository.
