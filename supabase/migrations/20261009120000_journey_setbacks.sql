-- Setbacks ("A setback is recorded, not reset") and rule edits on the journey page.

-- Lets setbacks tie their owner to the attempt's owner, as rules and attempts do with journeys.
alter table public.journey_attempts add constraint journey_attempts_id_user_id_key unique (id, user_id);

create table public.journey_setbacks (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  user_id uuid not null default auth.uid(),
  occurred_at timestamptz not null default now(),
  note text not null default '' check (char_length(note) <= 2000),
  -- continued: the attempt keeps running · restarted: it ended and the next attempt began.
  outcome text not null check (outcome in ('continued', 'restarted')),
  created_at timestamptz not null default now(),
  foreign key (attempt_id, user_id) references public.journey_attempts (id, user_id) on delete cascade
);

comment on table public.journey_setbacks is 'Setbacks recorded during an attempt. Continuing keeps the attempt; restarting opens the next one.';

create index journey_setbacks_attempt_idx on public.journey_setbacks (attempt_id, user_id);

alter table public.journey_setbacks enable row level security;

create policy "Journey setbacks are readable by their owner" on public.journey_setbacks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Journey setbacks are insertable by their owner" on public.journey_setbacks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Journey setbacks are editable by their owner" on public.journey_setbacks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Journey setbacks are deletable by their owner" on public.journey_setbacks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Record a setback ──────────────────────────────────────────────────
-- On the running attempt of p_journey_id. 'continued' only logs it; 'restarted'
-- also ends the attempt (reason 'setback') and opens attempt N + 1, in one
-- transaction. Returns the attempt that is running afterwards.
-- Security invoker: RLS limits it to the caller's own journeys.
create function public.record_setback(p_journey_id uuid, p_note text, p_outcome text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  current_attempt public.journey_attempts;
  next_id uuid;
begin
  if p_outcome not in ('continued', 'restarted') then
    raise exception 'p_outcome must be continued or restarted' using errcode = '22023';
  end if;

  select * into current_attempt
  from public.journey_attempts
  where journey_id = p_journey_id and ended_at is null
  for update;

  if not found then
    raise exception 'This journey has no running attempt' using errcode = 'P0002';
  end if;

  insert into public.journey_setbacks (attempt_id, note, outcome)
  values (current_attempt.id, btrim(coalesce(p_note, '')), p_outcome);

  if p_outcome = 'continued' then
    return current_attempt.id;
  end if;

  update public.journey_attempts
  set ended_at = now(), end_reason = 'setback'
  where id = current_attempt.id;

  insert into public.journey_attempts (journey_id, number)
  values (p_journey_id, current_attempt.number + 1)
  returning id into next_id;

  return next_id;
end;
$$;

-- ── Edit rules ────────────────────────────────────────────────────────
-- Replaces the journey's rules with p_rules ([{ kind, label, suggested }]) in
-- one transaction, in the given order.
create function public.replace_journey_rules(p_journey_id uuid, p_rules jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if jsonb_typeof(p_rules) <> 'array' or jsonb_array_length(p_rules) > 40 then
    raise exception 'p_rules must be an array of at most 40 rules' using errcode = '22023';
  end if;
  -- RLS hides other people's journeys, so this also checks ownership.
  if not exists (select 1 from public.journeys where id = p_journey_id) then
    raise exception 'Journey not found' using errcode = 'P0002';
  end if;

  delete from public.journey_rules where journey_id = p_journey_id;

  insert into public.journey_rules (journey_id, kind, label, suggested, position)
  select p_journey_id, e.rule ->> 'kind', btrim(e.rule ->> 'label'), coalesce((e.rule ->> 'suggested')::boolean, false), (e.ord - 1)::smallint
  from jsonb_array_elements(p_rules) with ordinality as e (rule, ord);
end;
$$;

revoke execute on function public.record_setback, public.replace_journey_rules from public, anon;
grant execute on function public.record_setback, public.replace_journey_rules to authenticated;
