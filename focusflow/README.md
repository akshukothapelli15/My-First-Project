# FocusFlow

FocusFlow is a student productivity workspace built with Next.js App Router, TypeScript, Tailwind CSS v4, PostgreSQL, Prisma, and a server-side OpenAI integration. It brings tasks, habits, goals, assignments, learning sessions, and student projects into one private workspace.

## Features

- Email/password registration and login, bcrypt password hashing, signed, HTTP-only seven-day sessions, protected routes, and account-scoped data access.
- A responsive dashboard, mobile navigation, global record search, deadline reminders, light/dark theme, and accessible keyboard-friendly controls.
- Create, edit, complete/reopen, delete, search, filter, prioritize, and date tasks; confirmation before delete; CSV export.
- Goals and projects with progress tracking; daily habit check-ins and calendar-date streaks; assignments with subject and status; study sessions and a focus timer.
- Month calendar, real-data progress charts, date-range analytics and reflection, and a transparent daily schedule suggestion with breaks.
- Server-side AI study coach using OpenAI when configured, with a useful local, rule-based fallback when the key is not set.
- Prisma schema, initial SQL migration, optional development seed data, security headers, validation, loading/error/empty states, and `.env.example` placeholders.

## Stack

Next.js 15 App Router · React 19 · TypeScript · PostgreSQL · Prisma 6 · Zod 3 · bcrypt · signed HTTP-only JWT cookie · OpenAI Responses API · Recharts · Lucide · Tailwind CSS 4.

## Requirements

- Windows 10/11
- Node.js 20.9+ (Node 22 LTS recommended) and npm
- A PostgreSQL 15+ database (local or hosted)
- Optional OpenAI API key to enable AI generated answers

## Windows setup

Open **PowerShell** in the project directory (`D:\akki`):

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Set `DATABASE_URL` and `DIRECT_URL` to your PostgreSQL database. Set `AUTH_SECRET` to a unique secret generated with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `.env.local` (the secret itself must not be committed). For a hosted PostgreSQL provider, `DATABASE_URL` may be a pooled URL and `DIRECT_URL` the provider's direct, unpooled URL. For local PostgreSQL, both can use the same connection string; create the `focusflow` database in PostgreSQL first.

Install and start the application:

```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open <http://localhost:3000> and create an account. On Windows PowerShell, stop the local server with `Ctrl+C`.

The included migration is `prisma/migrations/20260101000000_init/migration.sql`; Prisma will use it when running `migrate dev`. It creates the account, record, habit check-in, settings, and notification tables.

## Optional sample records

To create a clearly identified development account and five sample records:

1. Add `SEED_EMAIL` and `SEED_PASSWORD` to your ignored `.env.local` file.
2. Run:

```powershell
npm run db:seed
```

The seed script creates sample data only for the configured development account. Omit both variables for no seed data. Do not use the sample password or seed account in production.

## Optional AI assistant

Add a valid `OPENAI_API_KEY` to the server-side `.env.local` file and restart the development server. The default model is `gpt-4o-mini`; set `OPENAI_MODEL` to override it. The key is only read by the server route. If no key is set, the assistant makes an honest, rules-based suggestion from your own open work. If the configured service is unavailable, the UI reports that it could not connect. AI suggestions never create, edit, or delete records.

## Development commands

```powershell
npm run dev         # Local development server
npm run typecheck   # TypeScript check
npm run db:generate # Regenerate Prisma client
npm run db:migrate  # Apply a local migration
npm run db:seed     # Optional configured demo data
npm run db:studio   # Open Prisma Studio
npm run build       # Production build
npm run start       # Serve the production build
```

There is no test suite in this initial hackathon starter. Before a public deployment, add and run account-flow, tenant-isolation, API, and mobile browser tests. Do not treat a local typecheck/build as proof of production database behavior without testing against the deployment database.

## GitHub setup

```powershell
git init
git add .
git commit -m "Build FocusFlow student productivity platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/focusflow.git
git push -u origin main
```

The `.gitignore` excludes `.env`, `.env.local`, build output, and dependency folders. Check that no secrets were staged before pushing.

## Vercel deployment

1. Push this repository to GitHub and import it in Vercel.
2. Add a managed PostgreSQL database (for example Neon or Supabase) and set `DATABASE_URL` and `DIRECT_URL` in Vercel Project Settings for Production and Preview environments as appropriate.
3. Add `AUTH_SECRET` (generate a separate random secret for the deployment) and optionally `OPENAI_API_KEY` and `OPENAI_MODEL`.
4. Set the build command to `npm run build` and install command to `npm install`. Deploy a preview against a non-production database first.
5. Run `npx prisma migrate deploy` against the production database during a release step, then deploy and verify registration, sign-in, owner isolation, and record creation.

`vercel.json` is intentionally omitted so the platform can use the normal Next.js build and output settings. Never run the development seed against the production database.

### Production environment checklist

Required: `DATABASE_URL`, `DIRECT_URL` (may be identical if direct connections are supported), and `AUTH_SECRET` (at least 32 random characters). Optional: `OPENAI_API_KEY`, `OPENAI_MODEL`. Seed variables are development only and must not be set in production.

## Architecture

The App Router server layout authenticates the signed, HTTP-only cookie before rendering the private shell. Authenticated UI pages are client-side interactive views; all reads and writes go through server-side route handlers using Prisma. Each route derives the user ID from the verified session and applies it to every record lookup/update/delete. Zod validates incoming account and record payloads. Study assistant calls run on the server; without a key, the server returns a rule-based suggestion from the signed-in user's records. `ProductivityRecord` stores the shared, typed student record with validated fields and type-specific JSON details; habit check-ins are separately normalized and uniquely keyed by habit and date.

## Current limitations

- The initial schema uses a single normalized productivity record table for tasks, goals, habits, assignments, learning sessions, and projects. It provides working ownership boundaries, CRUD, progress, and uniquely dated habit check-ins, but does not yet include relational goal/project milestones, resource links, assignment subtasks, or collaborative project memberships.
- Assignments, projects, study sessions, and habits support the core create/edit flow, but recurring reminders, history/change audit, and email/push delivery are not implemented. Reminder UI is based on actual past-due records.
- The planner produces transparent due-date/priority/effort-based suggestions; it is not an AI optimization algorithm. Manually edit records to change estimates.
- AI answers use the model's default text response and server-side user-data context; structured AI schedule generation and notes summarization are not implemented. AI generated answers require an OpenAI key and a reachable account with model access.
- External authentication, MFA, rate limiting infrastructure, Vitest/Playwright tests, optional notification preferences, and live hosted deployment are not configured. The in-app email/password session uses signed cookies and has no session revocation dashboard.
- Build and database migration are not considered deployed until they have been verified against a configured PostgreSQL service.
