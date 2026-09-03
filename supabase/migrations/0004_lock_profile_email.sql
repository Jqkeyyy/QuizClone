-- Keep profile email addresses canonical and prevent clients from changing
-- the address used by the set-sharing lookup.

-- Repair any profile email that drifted before this restriction existed.
update public.profiles as profile
set email = auth_user.email
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.email is not null
  and profile.email is distinct from auth_user.email;

-- Auth email addresses are unique. Mirror that invariant for case-insensitive
-- sharing lookups so the RPC can never select an ambiguous profile.
create unique index if not exists profiles_email_lower_unique_idx
  on public.profiles (lower(email));

create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null then
    update public.profiles
    set email = new.email
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

revoke all on function private.sync_profile_email()
  from public, anon, authenticated;

-- Clients may edit only the display name. Email changes must go through
-- Supabase Auth and are mirrored by the trigger above.
revoke update on table public.profiles from authenticated;
grant update (display_name) on table public.profiles to authenticated;
