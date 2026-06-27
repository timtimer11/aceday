-- Row Level Security: every user can only reach their own days/tasks.
-- domains is shared, read-only reference data.
-- See docs/superpowers/specs/2026-06-27-aceday-db-foundation-design.md

alter table domains enable row level security;
alter table days    enable row level security;
alter table tasks   enable row level security;

-- domains: any logged-in user can read the shared list; nobody writes (system-managed).
create policy domains_select on domains
  for select to authenticated
  using (true);

-- days: a user sees and owns only their own rows.
create policy days_select on days
  for select to authenticated
  using (user_id = auth.uid());

create policy days_insert on days
  for insert to authenticated
  with check (user_id = auth.uid());

create policy days_update on days
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- a frozen day cannot be deleted (protects history / streaks).
create policy days_delete on days
  for delete to authenticated
  using (user_id = auth.uid() and locked_at is null);

-- tasks: access is gated through ownership of the parent day.
create policy tasks_select on tasks
  for select to authenticated
  using (exists (
    select 1 from days d where d.id = tasks.day_id and d.user_id = auth.uid()
  ));

create policy tasks_insert on tasks
  for insert to authenticated
  with check (exists (
    select 1 from days d where d.id = tasks.day_id and d.user_id = auth.uid()
  ));

create policy tasks_update on tasks
  for update to authenticated
  using (exists (
    select 1 from days d where d.id = tasks.day_id and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from days d where d.id = tasks.day_id and d.user_id = auth.uid()
  ));

create policy tasks_delete on tasks
  for delete to authenticated
  using (exists (
    select 1 from days d where d.id = tasks.day_id and d.user_id = auth.uid()
  ));
