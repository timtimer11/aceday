-- Foundation tests (pgTAP). Run with: supabase test db
-- Proves: scoreboard math, no double-log, RLS isolation, day-lock immutability.

begin;
select plan(15);

-- Helper to act as a given user (sets auth.uid()).
create or replace function _act_as(uid uuid) returns void
language sql as $$
  select set_config('role', 'authenticated', true);
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- ---- Fixtures (as postgres; bypasses RLS) ---------------------------------
\set u1 '11111111-1111-1111-1111-111111111111'
\set u2 '22222222-2222-2222-2222-222222222222'

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', :'u1', 'authenticated', 'authenticated', 'u1@test.dev', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', :'u2', 'authenticated', 'authenticated', 'u2@test.dev', '', now(), now(), now());

-- u1's days, fixed ids, fixed dates (all in January = "past" relative to June).
insert into days (id, user_id, date) values
  ('a0000000-0000-0000-0000-000000000001', :'u1', '2026-01-01'),  -- 3/3
  ('a0000000-0000-0000-0000-000000000002', :'u1', '2026-01-02'),  -- 2/3
  ('a0000000-0000-0000-0000-000000000003', :'u1', '2026-01-03'),  -- 1/3
  ('a0000000-0000-0000-0000-000000000004', :'u1', '2026-01-04'),  -- 2/4 tie
  ('a0000000-0000-0000-0000-000000000005', :'u1', '2026-01-05'),  -- 0 tasks
  ('a0000000-0000-0000-0000-000000000006', :'u1', '2026-06-01');  -- "today", stays open

-- tasks (domain 1 = Work; domain spread is an app rule, not a DB rule)
insert into tasks (day_id, domain_id, title, done) values
  ('a0000000-0000-0000-0000-000000000001', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000001', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000001', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000002', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000002', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000002', 1, 't', false),
  ('a0000000-0000-0000-0000-000000000003', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000003', 1, 't', false),
  ('a0000000-0000-0000-0000-000000000003', 1, 't', false),
  ('a0000000-0000-0000-0000-000000000004', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000004', 1, 't', true),
  ('a0000000-0000-0000-0000-000000000004', 1, 't', false),
  ('a0000000-0000-0000-0000-000000000004', 1, 't', false);

-- ---- Schema & seed --------------------------------------------------------
select is((select count(*)::int from domains), 4, 'four domains seeded');

-- ---- Scoreboard math (day_scores) -----------------------------------------
select is((select won from day_scores where day_id = 'a0000000-0000-0000-0000-000000000001'), true,  '3/3 is a win');
select is((select won from day_scores where day_id = 'a0000000-0000-0000-0000-000000000002'), true,  '2/3 is a win');
select is((select won from day_scores where day_id = 'a0000000-0000-0000-0000-000000000003'), false, '1/3 is a loss');
select is((select won from day_scores where day_id = 'a0000000-0000-0000-0000-000000000004'), false, '2/4 tie is a loss');
select is((select completed::int from day_scores where day_id = 'a0000000-0000-0000-0000-000000000002'), 2, '2/3 completed count');
select is((select won from day_scores where day_id = 'a0000000-0000-0000-0000-000000000005'), false, '0 tasks is a loss');

-- ---- No double-log --------------------------------------------------------
select throws_ok(
  $$ insert into days (user_id, date) values ('11111111-1111-1111-1111-111111111111', '2026-01-01') $$,
  '23505',
  null,
  'same (user, date) is rejected'
);

-- ---- RLS isolation --------------------------------------------------------
select _act_as('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from days), 0, 'u2 cannot see u1 days');
select is((select count(*)::int from domains), 4, 'u2 can read shared domains');
select set_config('role', 'postgres', true);
select _act_as('11111111-1111-1111-1111-111111111111');
select is((select count(*)::int from days), 6, 'u1 sees only own days');

-- ---- Day-lock (acting as u1) ----------------------------------------------
select lock_elapsed_days('2026-06-01');  -- locks Jan days, leaves 2026-06-01 open

select isnt((select locked_at from days where id = 'a0000000-0000-0000-0000-000000000001'), null, 'past day got frozen');
select is((select locked_at from days where id = 'a0000000-0000-0000-0000-000000000006'), null, 'today stays open');

select throws_ok(
  $$ insert into tasks (day_id, domain_id, title) values ('a0000000-0000-0000-0000-000000000001', 1, 'sneaky') $$,
  null, null, 'cannot add a task to a frozen day'
);

select throws_ok(
  $$ update days set locked_at = null where id = 'a0000000-0000-0000-0000-000000000001' $$,
  null, null, 'cannot un-freeze a frozen day'
);

select * from finish();
rollback;
