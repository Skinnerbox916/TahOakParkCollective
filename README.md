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

- Docker and Docker Compose

Development runs in Docker: the app container has its own `node_modules`, so install packages and run npm scripts inside it, not on the host.

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TahOakParkCollective
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Set at least `BETTER_AUTH_SECRET` (generate one with `openssl rand -base64 32`). For the usual local test logins, also set:

```bash
SEED_ADMIN_PASSWORD=password123
SEED_TEST_USERS=true
```

Never set `SEED_TEST_USERS` or a guessable `SEED_ADMIN_PASSWORD` in production, and never commit `.env`.

### 3. Start the Containers

The compose file expects an external Docker network named `proxy`. Create it once, then start everything:

```bash
docker network create proxy
docker compose up -d
```

`tahoak-web` runs `prisma generate` and `next dev` on [http://localhost:3000](http://localhost:3000), with `src/`, `public/` and `prisma/` mounted for hot reload. `tahoak-db` is Postgres 16 on `localhost:5432`.

### 4. Migrate and Seed

```bash
docker exec tahoak-web npm run db:migrate
docker exec tahoak-web npm run db:seed
```

The seed creates:
- 13 entity categories and the default tags
- Admin user `admin@tahoak.com`, only if it doesn't exist yet. Its password comes from `SEED_ADMIN_PASSWORD`; if that's unset, a random password is generated and printed once. Re-running the seed never changes an existing admin's password.
- Test user `owner@tahoak.com` / `owner123`, only when `SEED_TEST_USERS=true`. It manages nothing until you add it to a listing (admin entity page, Members) or it claims one.

In development, emails (including sign-in codes) are printed to `docker logs tahoak-web` instead of being sent.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Signs session cookies (32+ characters) | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public origin of the site. Passkeys are bound to this host | `http://localhost:3000` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Outgoing mail (required in production; unset in dev prints emails to the log) | `smtp.migadu.com`, `465` |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Sender and reply-to for every email | `"TahOak Park Collective <tahoak@canopyds.com>"` |
| `CONTACT_EMAIL` | Inbox for contact-form messages and admin notifications (new submissions, owner edits, issue reports, owners publishing). Defaults to `EMAIL_REPLY_TO` | `support@canopyds.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `development` |
| `APP_NAME` | Brand in emails, passkey prompts and authenticator apps | `TahOak Park Collective` |
| `POSTGRES_USER` | PostgreSQL username | `tahoak` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `tahoak_password` |
| `POSTGRES_DB` | PostgreSQL database name | `tahoak_db` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `DEEPL_API_KEY` | DeepL API key. With it, listing descriptions get a Spanish translation on save, and the translate buttons work. Without it, nothing is translated on save, and the buttons use a mock that prefixes `[ES] ` (dev only; production returns an error) | - |
| `OPENAI_API_KEY` | Admin AI tools (research a new listing, suggest updates). Without it those tools return an error | - |
| `UPLOAD_DIR` | Where uploaded images are stored, served at `/uploads/...`. In production, mount a persistent volume here or uploads are lost on redeploy | `<cwd>/uploads` (`/app/uploads` in the Docker image) |
| `SKIP_MIGRATIONS` | Set to `true` to stop the Docker image from running `prisma migrate deploy` on start | `false` |

## Database Management

Run Prisma commands inside the container:

```bash
docker exec tahoak-web npx prisma migrate dev --name <name>   # create a migration after editing schema.prisma
docker exec tahoak-web npm run db:generate                    # regenerate the client (output: src/generated/prisma)
docker exec tahoak-web npm run db:seed
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

Run these inside the container (`docker exec tahoak-web ...`):

```bash
npm run dev          # Start development server (the container runs this already)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Vitest service tests (needs TEST_DATABASE_URL, see Testing)
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed the database
npm run db:generate  # Generate Prisma Client
```

After `npm install <package>` in the container, copy `package.json` and `package-lock.json` back out, because the single-file mounts detach when npm rewrites them:

```bash
docker exec tahoak-web cat /app/package.json > package.json
docker exec tahoak-web cat /app/package-lock.json > package-lock.json
```

## Testing

The service tests run against a separate, migrated database, which they wipe:

```bash
docker exec tahoak-db createdb -U tahoak tahoak_test
docker exec -e DATABASE_URL=postgresql://tahoak:<password>@tahoak-db:5432/tahoak_test tahoak-web npx prisma migrate deploy
docker exec -e TEST_DATABASE_URL=postgresql://tahoak:<password>@tahoak-db:5432/tahoak_test tahoak-web npm test
```

### Test Credentials (Development Only)

After seeding the database:

- **Admin**: `admin@tahoak.com` / `password123`
- **Test user**: `owner@tahoak.com` / `owner123` (manages nothing until added to a listing)

**Warning**: These are test credentials. Never use them in production!

## Deployment

### Production Checklist

- [ ] Strong, unique `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` set to the HTTPS origin
- [ ] SMTP variables, `EMAIL_FROM` and `EMAIL_REPLY_TO` (and `CONTACT_EMAIL` if the site inbox differs from the reply-to address)
- [ ] `DEEPL_API_KEY` (and `OPENAI_API_KEY` for the admin AI tools)
- [ ] A persistent volume at `UPLOAD_DIR`
- [ ] Scheduled database backups

### CI and Production Deploys

Production runs on Coolify, and every merge to `main` deploys automatically. GitHub Actions (`.github/workflows/ci.yml`) runs on every PR and on `main`:

- applies all migrations to an empty Postgres and checks they match `prisma/schema.prisma`
- `tsc --noEmit`, `npm run lint` and `npm run build`
- builds the production image and boots it until `/api/health` responds

The production image applies pending migrations on start (`docker-entrypoint.sh`), so you don't need to run them by hand. The old container keeps serving while the new one migrates, so a migration must still work with the code that's currently deployed. For example, add a column in one deploy and drop the old one in a later deploy. The image's `HEALTHCHECK` calls `/api/health`, which queries the database. A container whose migration fails exits, never turns healthy, and Coolify keeps the previous one running.

The seed script is not run automatically. Run it by hand only on a fresh database.

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

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## License

See LICENSE file for details.

## Documentation

- [CLAUDE.md](./CLAUDE.md): architecture, data model and project rules (written for coding agents, useful for people too)
- [docs/TRANSLATION_GUIDE.md](./docs/TRANSLATION_GUIDE.md): the bilingual system
- [docs/UI_CONVENTIONS.md](./docs/UI_CONVENTIONS.md): UI components and color tokens
- [docs/product-brief.md](./docs/product-brief.md): the original product brief (background, not binding)

## Support

For issues and questions, please open an issue on the repository.
