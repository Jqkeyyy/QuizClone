-- Swap two cards in one transaction so a failed request cannot leave only one
-- position updated. As a security-invoker function, normal card RLS applies.
create or replace function public.swap_card_positions(p_first uuid, p_second uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_first_position integer;
  v_second_position integer;
  v_first_set uuid;
  v_second_set uuid;
begin
  select set_id, position into v_first_set, v_first_position
  from public.cards
  where id = p_first
  for update;

  select set_id, position into v_second_set, v_second_position
  from public.cards
  where id = p_second
  for update;

  if v_first_set is null or v_second_set is null then
    raise exception 'card not found';
  end if;
  if v_first_set <> v_second_set then
    raise exception 'cards must belong to the same set';
  end if;

  update public.cards
  set position = case id
    when p_first then v_second_position
    when p_second then v_first_position
  end
  where id in (p_first, p_second);
end;
$$;

revoke all on function public.swap_card_positions(uuid, uuid) from public, anon;
grant execute on function public.swap_card_positions(uuid, uuid) to authenticated;
