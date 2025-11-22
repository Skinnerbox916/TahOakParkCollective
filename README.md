# TahOak Park Collective

A business directory platform for local businesses in Tahoe Park, Oak Park, Elmhurst, Colonial Park, and Curtis Park neighborhoods of Sacramento, CA.

## Features

- **Public Business Directory**: Search and browse local businesses with map and list views
- **Business Owner Portal**: Business owners can manage their business profiles
- **Admin Dashboard**: Administrators can manage businesses, users, and approve listings
- **Authentication**: Secure role-based authentication with NextAuth
- **Map Integration**: Interactive maps showing business locations using Leaflet

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Maps**: React Leaflet
- **Styling**: Tailwind CSS
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

# NextAuth Configuration
# Generate a secure secret: openssl rand -base64 32
NEXTAUTH_SECRET=your_secure_random_string_here
NEXTAUTH_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

**Important Security Notes:**
- Never commit `.env` files to version control
- Use strong, unique passwords for production
- Generate a secure `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- Use different credentials for development and production

### 4. Start the Database

Using Docker Compose (recommended):

```bash
docker compose up -d tahoak-db
```

The database will be available at `localhost:5432`.

**Note**: Docker Compose will read environment variables from your `.env` file. Make sure `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are set if you want to override defaults.

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
- 8 business categories
- Admin user: `admin@tahoak.com` / `password123`
- Business owner: `owner@tahoak.com` / `owner123`
- 5 sample businesses

**Warning**: These are test credentials. Change them in production!

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
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `development` |
| `POSTGRES_USER` | PostgreSQL username | `tahoak` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `tahoak_password` |
| `POSTGRES_DB` | PostgreSQL database name | `tahoak_db` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |

## Database Management

### Running Migrations

Create a new migration:
```bash
npm run db:migrate
```

This will:
1. Create migration files in `prisma/migrations/`
2. Apply migrations to the database
3. Regenerate Prisma Client

### Seeding the Database

```bash
npm run db:seed
```

### Database Schema

The schema is defined in `prisma/schema.prisma`. Key models:

- **User**: Application users with roles (USER, ADMIN, BUSINESS_OWNER)
- **Business**: Business listings with location, category, and status
- **Category**: Business categories
- **Account/Session**: NextAuth authentication models

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seed script
│   └── migrations/         # Database migrations
├── src/
│   ├── app/                # Next.js app router pages
│   │   ├── (admin)/        # Admin routes
│   │   ├── (portal)/        # Business owner portal
│   │   ├── (public)/       # Public pages
│   │   └── api/            # API routes
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript types
├── docs/                    # Project documentation
│   └── AGENT_INSTRUCTIONS.md # Agent guide
├── .env.example            # Environment variables template
├── docker-compose.yml      # Docker services configuration
└── README.md               # This file
```

## Security

### Authentication

- Passwords are hashed using bcrypt (10 salt rounds)
- JWT-based sessions via NextAuth
- Role-based access control (RBAC)

### Authorization

- **Public Routes**: Business search and listings
- **Business Owner Routes**: `/portal/*` - Requires BUSINESS_OWNER or ADMIN role
- **Admin Routes**: `/admin/*` - Requires ADMIN role

### API Security

- Business update/delete endpoints require authentication
- Business owners can only modify their own businesses
- Only admins can change business status
- All API endpoints validate user permissions

### Best Practices

1. **Never commit secrets**: Use `.env` files (already in `.gitignore`)
2. **Use strong passwords**: Generate secure random strings for production
3. **Rotate secrets regularly**: Especially `NEXTAUTH_SECRET`
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
- **Business Owner**: `owner@tahoak.com` / `owner123`

**⚠️ Warning**: These are test credentials. Never use them in production!

## Deployment

### Production Checklist

- [ ] Set strong, unique `NEXTAUTH_SECRET`
- [ ] Use secure database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `NEXTAUTH_URL` (HTTPS)
- [ ] Set up database backups
- [ ] Configure environment variables in hosting platform
- [ ] Review and update all dependencies
- [ ] Set up monitoring and error tracking
- [ ] Configure CORS and security headers
- [ ] Set up SSL/TLS certificates

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

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your application URL
- Ensure user passwords are properly hashed in database

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## License

See LICENSE file for details.

## Agent Instructions

For LLM coding agents working on this project, see [docs/AGENT_INSTRUCTIONS.md](./docs/AGENT_INSTRUCTIONS.md) for:
- Development setup and Docker configuration
- Common issues and solutions
- Architecture patterns and conventions
- Key learnings and gotchas

## Support

For issues and questions, please open an issue on the repository.
