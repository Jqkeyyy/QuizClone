-- Keep the denormalized set visibility value aligned with actual membership.
create or replace function private.sync_set_visibility()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_set uuid;
  v_visibility text;
begin
  if tg_op in ('DELETE', 'UPDATE') then
    v_set := old.set_id;

    select case
      when exists (select 1 from public.set_members where set_id = v_set) then 'shared'
      else 'private'
    end into v_visibility;

    update public.sets
    set visibility = v_visibility
    where id = v_set and visibility is distinct from v_visibility;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and
     (tg_op <> 'UPDATE' or old.set_id is distinct from new.set_id) then
    v_set := new.set_id;

    select case
      when exists (select 1 from public.set_members where set_id = v_set) then 'shared'
      else 'private'
    end into v_visibility;

    update public.sets
    set visibility = v_visibility
    where id = v_set and visibility is distinct from v_visibility;
  end if;

  return null;
end;
$$;

revoke all on function private.sync_set_visibility() from public, anon, authenticated;

drop trigger if exists set_members_sync_visibility on public.set_members;
create trigger set_members_sync_visibility
  after insert or delete or update of set_id on public.set_members
  for each row execute function private.sync_set_visibility();

update public.sets as target
set visibility = case
  when exists (select 1 from public.set_members where set_id = target.id) then 'shared'
  else 'private'
end
where visibility is distinct from case
  when exists (select 1 from public.set_members where set_id = target.id) then 'shared'
  else 'private'
end;

-- Support the per-user, per-set history queries used by the Progress page.
create index if not exists study_sessions_user_set_started_idx
  on public.study_sessions (user_id, set_id, started_at desc);

create index if not exists test_attempts_user_set_created_idx
  on public.test_attempts (user_id, set_id, created_at desc);
