-- Let an authenticated user atomically clear only their own learning data for
-- one set. The existing row-level policies still apply because this function
-- runs with the caller's privileges.
create or replace function public.reset_my_set_progress(p_set uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.card_progress
  where user_id = (select auth.uid()) and set_id = p_set;

  delete from public.study_sessions
  where user_id = (select auth.uid()) and set_id = p_set;

  delete from public.test_attempts
  where user_id = (select auth.uid()) and set_id = p_set;
end;
$$;

revoke all on function public.reset_my_set_progress(uuid) from public, anon;
grant execute on function public.reset_my_set_progress(uuid) to authenticated;
