-- create_journey: read the rules with jsonb_array_elements (WITH ORDINALITY
-- can't be combined with jsonb_to_recordset's column list).
create or replace function public.create_journey(
  p_name text,
  p_what text,
  p_why text,
  p_length_days smallint,
  p_checkpoint_days smallint[],
  p_color text,
  p_rules jsonb default '[]'
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if jsonb_typeof(p_rules) <> 'array' or jsonb_array_length(p_rules) > 40 then
    raise exception 'p_rules must be an array of at most 40 rules' using errcode = '22023';
  end if;

  insert into public.journeys (name, what_text, why_text, length_days, checkpoint_days, color)
  values (btrim(p_name), btrim(coalesce(p_what, '')), btrim(p_why), p_length_days, p_checkpoint_days, p_color)
  returning id into new_id;

  insert into public.journey_rules (journey_id, kind, label, suggested, position)
  select new_id, e.rule ->> 'kind', btrim(e.rule ->> 'label'), coalesce((e.rule ->> 'suggested')::boolean, false), (e.ord - 1)::smallint
  from jsonb_array_elements(p_rules) with ordinality as e (rule, ord);

  insert into public.journey_attempts (journey_id, number) values (new_id, 1);

  return new_id;
end;
$$;
