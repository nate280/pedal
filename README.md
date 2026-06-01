# Pedal

Bike fleet maintenance tracker for boutique cycle studios. Log issues against
bikes, push repairs through an Open → In Progress → Resolved flow, and watch
fleet health on a live dashboard.

Dark, premium, minimal — Vite + React, Tailwind, shadcn/ui, Recharts, Framer
Motion, and Supabase for auth, data, and photo storage.

## Stack

- **Vite + React 18**
- **Tailwind CSS** + **shadcn/ui** (new-york) components
- **Lucide** icons, **Recharts** dashboard, **Framer Motion** transitions
- **Supabase** — Postgres, Auth (email/password), Storage

## Getting started

```bash
npm install
npm run dev
```

The app boots into a **Connect Supabase** screen until credentials are present.

### 1. Configure Supabase

Copy your project's API values into `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Find them in the Supabase dashboard under **Settings → API**. Restart
`npm run dev` after editing.

### 2. Run the migration

In the Supabase dashboard, open **SQL Editor** and run the migrations in order:

1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) —
   schema, enum types, indexes, row-level-security policies, and the
   `issue-photos` storage bucket.
2. [`supabase/migrations/0002_rename_and_positions.sql`](supabase/migrations/0002_rename_and_positions.sql)
   — only needed if you seeded **before** the "Bike NN" / numeric floor-position
   conventions; it renames the studio to MOJO, renames bikes, converts floor
   positions to numbers, and scales the fleet to 29 bikes. Idempotent.

### 3. (Optional) Seed demo data

Run [`supabase/seed.sql`](supabase/seed.sql) for a populated demo studio —
**MOJO Cycling Studio**, 29 bikes (floor positions 1–29), real issue history,
and notes — so the dashboard and fleet aren't empty. Skip 0002 if you seed fresh.

### 4. Create an account

Sign up from the login screen. By default Supabase requires email confirmation —
disable it under **Authentication → Providers → Email** for instant local
testing.

## Schema

| Table          | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `studios`      | One row per studio                                 |
| `bikes`        | Fleet, with floor position + rolled-up status      |
| `issues`       | Maintenance reports (severity, status, reporter)   |
| `issue_notes`  | Repair-progress notes on an issue                  |
| `issue_photos` | Photo attachments (Supabase Storage public URLs)   |

Bike `status` is kept in sync automatically as issues are opened and resolved.

## Project layout

```
src/
  components/        Sidebar, layout, cards, badges, IssueDialog, ui/ (shadcn)
  context/           AuthContext, DataContext (fetching + mutations)
  pages/             Login, Dashboard, Fleet, BikeDetail, LogIssue, Settings
  lib/               supabase client, constants, utils
supabase/
  migrations/0001_init.sql
  migrations/0002_rename_and_positions.sql
  seed.sql
```
