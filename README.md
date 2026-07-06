# AceDay

A self-improvement tracker that scores your day like a tactical-shooter match.
One week = one match, each day = a round. Add ≥3 tasks across domains, mark what
you did, and the round resolves win/loss — no neutral days. The weekly recap (day
strip, scoreline, rating, MVP, biggest liability) is the payoff.

## Stack

- **Frontend:** Vite + React + TypeScript, Tailwind v4, installable PWA.
- **Data:** TanStack Query (optimistic-but-reconciled writes).
- **Backend:** Supabase (Postgres + Auth + Row Level Security) — no separate server.

## Local development

Requires Node and a Docker runtime (e.g. OrbStack) for the Supabase CLI.

```bash
# 1. Start the local Supabase stack (Postgres + Auth) and apply migrations
supabase start
supabase db reset          # applies migrations + seeds domains

# 2. Configure the web app
cp .env.example .env.local # fill with values from `supabase status`

# 3. Run the app
npm install
npm run dev                # http://localhost:5173
```

Magic-link sign-in emails are caught locally by Mailpit at http://127.0.0.1:54324.

## Database

Migrations live in `supabase/migrations/` (schema, RLS, day-lock). The win rule
lives once in the `day_scores` view: a round is won when `completed*2 > total`.
Past days freeze on app open (`lock_elapsed_days`) so history can't be rewritten.

```bash
supabase test db           # runs the pgTAP tests in supabase/tests/
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build
