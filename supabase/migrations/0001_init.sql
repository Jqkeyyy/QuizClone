-- ─────────────────────────────────────────────────────────────
-- profiles: mirror of auth.users so we can join/display names
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- sets
-- Using text + check instead of enums: Postgres enums are painful
-- to change later, and you will want to add a visibility level.
-- ─────────────────────────────────────────────────────────────
create table public.sets (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (length(btrim(title)) > 0),
  description text,
  exam_date   date,                       -- optional; drives interval clamping
  visibility  text not null default 'private'
              check (visibility in ('private','shared')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index sets_owner_idx on public.sets (owner_id, updated_at desc);

-- ─────────────────────────────────────────────────────────────
-- cards
-- ─────────────────────────────────────────────────────────────
create table public.cards (
  id               uuid primary key default gen_random_uuid(),
  set_id           uuid not null references public.sets(id) on delete cascade,
  term             text not null,
  definition       text not null,
  term_image       text,        -- storage path, not URL
  definition_image text,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index cards_set_position_idx on public.cards (set_id, position);

-- ─────────────────────────────────────────────────────────────
-- set_members: who else can see/edit a set
-- ─────────────────────────────────────────────────────────────
create table public.set_members (
  set_id     uuid not null references public.sets(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('viewer','editor')),
  created_at timestamptz not null default now(),
  primary key (set_id, user_id)
);
create index set_members_user_idx on public.set_members (user_id);

-- ─────────────────────────────────────────────────────────────
-- card_progress: one row per (user, card). This is the Learn engine's state.
-- set_id is denormalized so "what's due in this set" is a single-table query.
-- ─────────────────────────────────────────────────────────────
create table public.card_progress (
  user_id             uuid not null references public.profiles(id) on delete cascade,
  card_id             uuid not null references public.cards(id) on delete cascade,
  set_id              uuid not null references public.sets(id) on delete cascade,
  box                 smallint not null default 0,     -- 0..5 Leitner box
  consecutive_correct smallint not null default 0,
  lapses              integer  not null default 0,
  times_seen          integer  not null default 0,
  times_correct       integer  not null default 0,
  starred             boolean  not null default false,
  due_at              timestamptz not null default now(),
  last_seen_at        timestamptz,
  primary key (user_id, card_id)
);
create index card_progress_due_idx on public.card_progress (user_id, set_id, due_at);

-- ─────────────────────────────────────────────────────────────
-- session + attempt history (for the stats screen; optional but cheap)
-- ─────────────────────────────────────────────────────────────
create table public.study_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  set_id        uuid not null references public.sets(id) on delete cascade,
  mode          text not null check (mode in ('flashcards','learn','test','cram')),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  cards_seen    integer not null default 0,
  cards_correct integer not null default 0
);

create table public.test_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  set_id         uuid not null references public.sets(id) on delete cascade,
  question_count integer not null,
  score          integer not null,
  config         jsonb not null default '{}'::jsonb,
  answers        jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- updated_at
-- ─────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger sets_touch  before update on public.sets  for each row execute function public.touch_updated_at();
create trigger cards_touch before update on public.cards for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 3.1 Permission helpers
-- security definer so cross-table RLS checks don't recurse.
-- ─────────────────────────────────────────────────────────────
-- WARNING: never use this function in a SELECT policy on public.sets itself.
-- RLS re-checks a SELECT policy against the RETURNING clause of INSERT/UPDATE,
-- and this function's query on sets can't see the row the current command
-- just wrote (even though it's security definer / stable — this is snapshot
-- visibility relative to the current command, not permissions or caching).
-- That breaks `.insert(...).select()` / `.update(...).select()` on sets for
-- everyone, including the owner. See 0002_fix_sets_select_returning.sql.
-- It's still fine to use here in cards_select, profiles_select, and the
-- storage policies below, since those query a different, already-committed
-- table.
create or replace function public.can_read_set(p_set uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.sets s
                 where s.id = p_set and s.owner_id = auth.uid())
      or exists (select 1 from public.set_members m
                 where m.set_id = p_set and m.user_id = auth.uid());
$$;

create or replace function public.can_edit_set(p_set uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.sets s
                 where s.id = p_set and s.owner_id = auth.uid())
      or exists (select 1 from public.set_members m
                 where m.set_id = p_set and m.user_id = auth.uid()
                   and m.role = 'editor');
$$;

create or replace function public.is_set_owner(p_set uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.sets s
                 where s.id = p_set and s.owner_id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────
-- 3.2 add_member_by_email: looks up + inserts in one security definer
-- call, after checking ownership. A plain client select on profiles
-- would return zero rows under the profiles_select policy below.
-- ─────────────────────────────────────────────────────────────
create or replace function public.add_member_by_email(
  p_set uuid, p_email text, p_role text default 'viewer'
) returns public.set_members
language plpgsql security definer
set search_path = public as $$
declare v_user uuid; v_row public.set_members;
begin
  if not public.is_set_owner(p_set) then
    raise exception 'not the owner of this set';
  end if;
  if p_role not in ('viewer','editor') then
    raise exception 'invalid role';
  end if;

  select id into v_user from public.profiles
   where lower(email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'no account with that email — invite them from the Supabase dashboard first';
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

revoke all on function public.add_member_by_email(uuid, text, text) from public;
grant execute on function public.add_member_by_email(uuid, text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3.3 RLS policies
-- ─────────────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.sets           enable row level security;
alter table public.cards          enable row level security;
alter table public.set_members    enable row level security;
alter table public.card_progress  enable row level security;
alter table public.study_sessions enable row level security;
alter table public.test_attempts  enable row level security;

-- profiles: you see yourself, plus anyone who shares a set with you
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or exists (select 1 from public.set_members m
               where m.user_id = profiles.id
                 and public.is_set_owner(m.set_id))
    or exists (select 1 from public.sets s
               where s.owner_id = profiles.id
                 and public.can_read_set(s.id))
  );
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- sets: read if owner or member; write only if owner
create policy sets_select on public.sets for select using (public.can_read_set(id));
create policy sets_insert on public.sets for insert with check (owner_id = auth.uid());
create policy sets_update on public.sets for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy sets_delete on public.sets for delete using (owner_id = auth.uid());

-- cards: read with the set, write if owner or editor
create policy cards_select on public.cards for select using (public.can_read_set(set_id));
create policy cards_insert on public.cards for insert with check (public.can_edit_set(set_id));
create policy cards_update on public.cards for update
  using (public.can_edit_set(set_id)) with check (public.can_edit_set(set_id));
create policy cards_delete on public.cards for delete using (public.can_edit_set(set_id));

-- set_members: you see your own memberships; owner manages the list
create policy members_select on public.set_members for select
  using (user_id = auth.uid() or public.is_set_owner(set_id));
create policy members_insert on public.set_members for insert
  with check (public.is_set_owner(set_id));
create policy members_update on public.set_members for update
  using (public.is_set_owner(set_id)) with check (public.is_set_owner(set_id));
create policy members_delete on public.set_members for delete
  using (public.is_set_owner(set_id) or user_id = auth.uid());  -- let people leave

-- progress + history: strictly your own
create policy progress_all on public.card_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sessions_all on public.study_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy attempts_all on public.test_attempts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3.4 Storage for card images
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', false)
on conflict (id) do nothing;

-- path convention: {set_id}/{card_id}-{nanoid}.webp
create policy card_images_read on storage.objects for select
  using (bucket_id = 'card-images'
         and public.can_read_set(((storage.foldername(name))[1])::uuid));

create policy card_images_write on storage.objects for insert
  with check (bucket_id = 'card-images'
              and public.can_edit_set(((storage.foldername(name))[1])::uuid));

create policy card_images_delete on storage.objects for delete
  using (bucket_id = 'card-images'
         and public.can_edit_set(((storage.foldername(name))[1])::uuid));
