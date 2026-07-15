# WiFi Admin

Internal admin tool for a WiFi/ISP reseller business — customers, billing, payments, expenses, inventory, documents, and SMS reminders. Owner and Staff roles, PHP currency, Asia/Manila timezone.

## Stack

- Next.js 15 (App Router, TypeScript) on Vercel
- Supabase (database, auth, storage)
- Tailwind CSS + shadcn/ui
- Recharts for charts
- SMS reminders via Semaphore (daily cron); everything else is copy-to-clipboard

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in real values as they become available
npm run dev
```

## Environment variables

See `.env.example`. Values arrive in stages:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Day 2
- `SEMAPHORE_API_KEY`, `CRON_SECRET` — Day 6

## Deployment

Push to `main` on GitHub; Vercel auto-deploys from there. Set the same environment variables in the Vercel project settings (Project → Settings → Environment Variables) as they're added to `.env.local`.

## Roles

- **Owner** — sees and manages everything.
- **Staff** — everything except Expenses, the Activity Log, and Settings.

## Build log

- [x] Day 1 — Project scaffolding & deploy pipeline
- [ ] Day 2 — Database schema, RLS, storage bucket
- [ ] Day 3 — Authentication & role-based access
- [ ] Day 4 — App shell, navigation, design system
- [ ] Day 5 — Customers & Plans (CRUD)
- [ ] Day 6 — Messaging (copy-template + SMS automation)
- [ ] Day 7 — Payments ledger & history
- [ ] Day 8 — Expenses & ROI recovery (Owner-only)
- [ ] Day 9 — Dashboard (Home)
- [ ] Day 10 — Equipment inventory
- [ ] Day 11 — Customer documents
- [ ] Day 12 — Due-date calendar
- [ ] Day 13 — Activity log (Owner-only)
- [ ] Day 14 — Notifications, search, export, soft-delete, Settings
- [ ] Day 15 — QA pass & final deploy check
