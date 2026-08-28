-- Fix: sets_select used can_read_set(id), a SECURITY DEFINER function that
-- queries public.sets itself. Postgres RLS re-checks the SELECT policy for
-- the RETURNING clause of INSERT/UPDATE, and a SECURITY DEFINER function
-- querying its own table in that context does not see the row the current
-- command just wrote (even though it correctly sees it on a later, separate
-- SELECT). That made every `.insert(...).select()` / `.update(...).select()`
-- on sets fail with "new row violates row-level security policy for table
-- sets", even for the row's own owner.
--
-- Fix: inline the ownership check directly (no self-referential function
-- call), and check set_members with a plain EXISTS instead of going through
-- can_read_set(). This avoids the SECURITY DEFINER + RETURNING interaction
-- entirely, while keeping identical visibility rules (owner OR member).
drop policy sets_select on public.sets;
create policy sets_select on public.sets for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.set_members m
      where m.set_id = sets.id and m.user_id = auth.uid()
    )
  );
