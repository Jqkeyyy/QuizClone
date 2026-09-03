-- Keep authorization helpers outside the Data API's exposed public schema.
-- SECURITY DEFINER functions must use an empty search path and explicitly
-- schema-qualify every relation they access.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.can_read_set(p_set uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.sets as s
    where s.id = p_set and s.owner_id = (select auth.uid())
  ) or exists (
    select 1
    from public.set_members as m
    where m.set_id = p_set and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_edit_set(p_set uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.sets as s
    where s.id = p_set and s.owner_id = (select auth.uid())
  ) or exists (
    select 1
    from public.set_members as m
    where m.set_id = p_set
      and m.user_id = (select auth.uid())
      and m.role = 'editor'
  );
$$;

create or replace function private.is_set_owner(p_set uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.sets as s
    where s.id = p_set and s.owner_id = (select auth.uid())
  );
$$;

revoke all on function private.can_read_set(uuid) from public, anon;
revoke all on function private.can_edit_set(uuid) from public, anon;
revoke all on function private.is_set_owner(uuid) from public, anon;
grant execute on function private.can_read_set(uuid) to authenticated;
grant execute on function private.can_edit_set(uuid) to authenticated;
grant execute on function private.is_set_owner(uuid) to authenticated;

-- Move trigger functions out of the exposed schema as well.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop trigger sets_touch on public.sets;
create trigger sets_touch
  before update on public.sets
  for each row execute function private.touch_updated_at();

drop trigger cards_touch on public.cards;
create trigger cards_touch
  before update on public.cards
  for each row execute function private.touch_updated_at();

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

-- This ownership-checked RPC intentionally remains in public so the client
-- can call it through the Data API.
create or replace function public.add_member_by_email(
  p_set uuid, p_email text, p_role text default 'viewer'
) returns public.set_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_row public.set_members;
begin
  if not private.is_set_owner(p_set) then
    raise exception 'not the owner of this set';
  end if;
  if p_role not in ('viewer', 'editor') then
    raise exception 'invalid role';
  end if;

  select id into v_user
  from public.profiles
  where lower(email) = lower(btrim(p_email));

  if v_user is null then
    raise exception 'no account with that email';
  end if;
  if v_user = auth.uid() then
    raise exception 'you already own this set';
  end if;

  insert into public.set_members (set_id, user_id, role)
  values (p_set, v_user, p_role)
  on conflict (set_id, user_id) do update set role = excluded.role
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_member_by_email(uuid, text, text) from public, anon;
grant execute on function public.add_member_by_email(uuid, text, text) to authenticated;

-- Limit every application policy to authenticated requests and point
-- cross-table checks at the non-exposed helper functions.
alter policy profiles_select on public.profiles to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.set_members as m
      where m.user_id = profiles.id
        and private.is_set_owner(m.set_id)
    )
    or exists (
      select 1
      from public.sets as s
      where s.owner_id = profiles.id
        and private.can_read_set(s.id)
    )
  );
alter policy profiles_update on public.profiles to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy sets_select on public.sets to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.set_members as m
      where m.set_id = sets.id and m.user_id = (select auth.uid())
    )
  );
alter policy sets_insert on public.sets to authenticated
  with check (owner_id = (select auth.uid()));
alter policy sets_update on public.sets to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
alter policy sets_delete on public.sets to authenticated
  using (owner_id = (select auth.uid()));

alter policy cards_select on public.cards to authenticated
  using (private.can_read_set(set_id));
alter policy cards_insert on public.cards to authenticated
  with check (private.can_edit_set(set_id));
alter policy cards_update on public.cards to authenticated
  using (private.can_edit_set(set_id))
  with check (private.can_edit_set(set_id));
alter policy cards_delete on public.cards to authenticated
  using (private.can_edit_set(set_id));

alter policy members_select on public.set_members to authenticated
  using (user_id = (select auth.uid()) or private.is_set_owner(set_id));
alter policy members_insert on public.set_members to authenticated
  with check (private.is_set_owner(set_id));
alter policy members_update on public.set_members to authenticated
  using (private.is_set_owner(set_id))
  with check (private.is_set_owner(set_id));
alter policy members_delete on public.set_members to authenticated
  using (private.is_set_owner(set_id) or user_id = (select auth.uid()));

alter policy progress_all on public.card_progress to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.can_read_set(set_id));
alter policy sessions_all on public.study_sessions to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.can_read_set(set_id));
alter policy attempts_all on public.test_attempts to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.can_read_set(set_id));

alter policy card_images_read on storage.objects to authenticated
  using (
    bucket_id = 'card-images'
    and private.can_read_set(((storage.foldername(name))[1])::uuid)
  );
alter policy card_images_write on storage.objects to authenticated
  with check (
    bucket_id = 'card-images'
    and private.can_edit_set(((storage.foldername(name))[1])::uuid)
  );
alter policy card_images_delete on storage.objects to authenticated
  using (
    bucket_id = 'card-images'
    and private.can_edit_set(((storage.foldername(name))[1])::uuid)
  );

-- The bucket remains private; these limits reduce malicious or accidental
-- storage consumption and reject non-image content at the Storage API.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'card-images';

-- Anonymous clients do not need direct Data API access. Authenticated access
-- is granted per operation; RLS still decides which rows are allowed.
revoke all privileges on table public.profiles from anon, authenticated;
revoke all privileges on table public.sets from anon, authenticated;
revoke all privileges on table public.cards from anon, authenticated;
revoke all privileges on table public.set_members from anon, authenticated;
revoke all privileges on table public.card_progress from anon, authenticated;
revoke all privileges on table public.study_sessions from anon, authenticated;
revoke all privileges on table public.test_attempts from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.sets to authenticated;
grant select, insert, update, delete on table public.cards to authenticated;
grant select, insert, update, delete on table public.set_members to authenticated;
grant select, insert, update, delete on table public.card_progress to authenticated;
grant select, insert, update, delete on table public.study_sessions to authenticated;
grant select, insert, update, delete on table public.test_attempts to authenticated;

-- Remove the old helpers after all policies and RPCs reference private.*.
drop function public.can_read_set(uuid);
drop function public.can_edit_set(uuid);
drop function public.is_set_owner(uuid);
drop function public.handle_new_user();
drop function public.touch_updated_at();

-- Make future public-schema functions opt-in for Data API roles.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
