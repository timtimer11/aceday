-- AceDay schema: domains, days, tasks, and the derived day_scores view.
-- See docs/superpowers/specs/2026-06-27-aceday-db-foundation-design.md

-- domains: the life-areas a task can belong to (system-wide for now).
create table domains (
  id         smallint generated always as identity primary key,
  name       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into domains (name) values ('Work'), ('Body'), ('Mind'), ('Home');

-- days: one row per user per calendar day = one round of the weekly match.
create table days (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,                       -- LOCAL date, authoritative round key
  locked_at  timestamptz,                         -- null = open, set = frozen history
  created_at timestamptz not null default now(),  -- UTC, debug/future only
  unique (user_id, date)                          -- a day can never be double-logged
);

-- tasks: the individual to-dos that make up a day. Score is derived from these.
create table tasks (
  id         uuid primary key default gen_random_uuid(),
  day_id     uuid not null references days (id) on delete cascade,
  domain_id  smallint not null references domains (id),
  title      text not null check (length(trim(title)) > 0),
  done       boolean not null default false,
  created_at timestamptz not null default now()   -- also the display order
);

-- day_scores: the single source of truth for a round's verdict.
-- won = "more than half done"  ->  completed*2 > total  (ties and below lose).
create view day_scores
with (security_invoker = true) as
select
  d.id      as day_id,
  d.user_id,
  d.date,
  count(*) filter (where t.done) as completed,
  count(t.*)                     as total,
  (count(*) filter (where t.done)) * 2 > count(t.*) as won
from days d
left join tasks t on t.day_id = d.id
group by d.id, d.user_id, d.date;
