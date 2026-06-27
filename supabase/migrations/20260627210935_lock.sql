-- Day-lock: freeze elapsed days so history can't be rewritten.
-- See docs/superpowers/specs/2026-06-27-aceday-db-foundation-design.md

-- Called by the app on open with the user's LOCAL today.
-- Freezes the caller's own days that are now in the past and not yet frozen.
create function lock_elapsed_days(p_today date)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.days
     set locked_at = now()
   where user_id = (select auth.uid())
     and date < p_today
     and locked_at is null;
$$;

revoke all on function lock_elapsed_days(date) from public;
grant execute on function lock_elapsed_days(date) to authenticated;

-- Guard 1: no inserts/updates/deletes of tasks on a frozen day.
create function reject_if_day_locked()
returns trigger
language plpgsql
as $$
declare
  v_locked timestamptz;
begin
  select locked_at into v_locked
    from public.days
   where id = coalesce(new.day_id, old.day_id);

  if v_locked is not null then
    raise exception 'day is locked; its tasks cannot be changed';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger tasks_block_when_locked
  before insert or update or delete on tasks
  for each row execute function reject_if_day_locked();

-- Guard 2: a day's date is immutable, and a frozen day can never be un-frozen.
-- (locked_at may go null -> timestamp once; never back, never changed.)
create function enforce_day_immutability()
returns trigger
language plpgsql
as $$
begin
  if new.date <> old.date then
    raise exception 'day date is immutable';
  end if;

  if old.locked_at is not null and new.locked_at is distinct from old.locked_at then
    raise exception 'a locked day cannot be modified';
  end if;

  return new;
end;
$$;

create trigger days_immutability
  before update on days
  for each row execute function enforce_day_immutability();
