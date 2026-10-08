-- Journeys: one thing the user is changing, the rules they approved, and each
-- attempt at it. Status isn't stored: an attempt is active until it ends or
-- reaches the journey's length, so nothing has to run on a timer.
-- Setbacks arrive with the journey detail (phase 7).

create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  -- Step 1 ("What are you changing?") and step 2 ("Why?") in the user's words.
  what_text text not null default '' check (char_length(what_text) <= 2000),
  why_text text not null check (char_length(btrim(why_text)) between 1 and 2000),
  why_written_at timestamptz not null default now(),
  length_days smallint not null check (length_days in (30, 60, 90)),
  -- The floors kept in step 4: always day 1 and the last day.
  checkpoint_days smallint[] not null check (
    checkpoint_days <@ array[1, 3, 7, 14, 30, 60, 90]::smallint[]
    and 1 = any (checkpoint_days)
    and length_days = any (checkpoint_days)
    and length_days >= all (checkpoint_days)
  ),
  -- A palette key (see JOURNEY_COLORS in app/utils/journey.ts), not raw CSS.
  color text not null default 'amber' check (color in ('amber', 'blue', 'sand', 'slate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets child tables tie their owner to the journey's owner.
  unique (id, user_id)
);

comment on table public.journeys is 'Things the user is changing on purpose ("Start a journey").';

create table public.journey_rules (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null,
  user_id uuid not null default auth.uid(),
  kind text not null check (kind in ('remove', 'allow')),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  -- Offered by the app rather than read from the user's text.
  suggested boolean not null default false,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  foreign key (journey_id, user_id) references public.journeys (id, user_id) on delete cascade
);

comment on table public.journey_rules is 'What a journey removes and what stays allowed.';

create table public.journey_attempts (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null,
  user_id uuid not null default auth.uid(),
  number smallint not null check (number >= 1),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('setback', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (journey_id, user_id) references public.journeys (id, user_id) on delete cascade,
  unique (journey_id, number),
  check ((ended_at is null) = (end_reason is null)),
  check (ended_at is null or ended_at >= started_at)
);

comment on table public.journey_attempts is 'Each try at a journey. A restart ends one attempt and opens the next.';

-- At most one running attempt per journey.
create unique index journey_attempts_one_open_idx on public.journey_attempts (journey_id) where ended_at is null;
create index journeys_user_idx on public.journeys (user_id, created_at);
create index journey_rules_journey_idx on public.journey_rules (journey_id, user_id);
create index journey_attempts_journey_idx on public.journey_attempts (journey_id, user_id);
create index journey_attempts_user_started_idx on public.journey_attempts (user_id, started_at);

create trigger journeys_set_updated_at
  before update on public.journeys
  for each row execute function public.set_updated_at();

create trigger journey_attempts_set_updated_at
  before update on public.journey_attempts
  for each row execute function public.set_updated_at();

alter table public.journeys enable row level security;
alter table public.journey_rules enable row level security;
alter table public.journey_attempts enable row level security;

create policy "Journeys are readable by their owner" on public.journeys
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Journeys are insertable by their owner" on public.journeys
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Journeys are editable by their owner" on public.journeys
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Journeys are deletable by their owner" on public.journeys
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Journey rules are readable by their owner" on public.journey_rules
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Journey rules are insertable by their owner" on public.journey_rules
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Journey rules are editable by their owner" on public.journey_rules
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Journey rules are deletable by their owner" on public.journey_rules
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Journey attempts are readable by their owner" on public.journey_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Journey attempts are insertable by their owner" on public.journey_attempts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Journey attempts are editable by their owner" on public.journey_attempts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Journey attempts are deletable by their owner" on public.journey_attempts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── Create ────────────────────────────────────────────────────────────
-- The wizard's "Begin at Floor I": the journey, its rules and attempt #1 in one
-- transaction. p_rules is [{ "kind": "remove" | "allow", "label": text, "suggested": bool }].
-- Security invoker: RLS and the checks above still apply.
create function public.create_journey(
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
  select new_id, r.kind, btrim(r.label), coalesce(r.suggested, false), (r.ord - 1)::smallint
  from jsonb_to_recordset(p_rules) with ordinality as r (kind text, label text, suggested boolean, ord bigint);

  insert into public.journey_attempts (journey_id, number) values (new_id, 1);

  return new_id;
end;
$$;

-- ── Mood around attempts ──────────────────────────────────────────────
-- Average score during each attempt (until it ended, reached its length, or
-- now) and over the 30 days before it began. "Mood vs before" on Journeys.
create function public.journey_attempt_moods()
returns table (
  attempt_id uuid,
  before_average numeric,
  before_entries bigint,
  during_average numeric,
  during_entries bigint
)
language sql
stable
set search_path = ''
as $$
  select
    a.id,
    round(b.average, 2), b.entries,
    round(d.average, 2), d.entries
  from public.journey_attempts a
  join public.journeys j on j.id = a.journey_id
  cross join lateral (
    select avg(m.score) as average, count(*) as entries
    from public.mood_entries m
    where m.user_id = a.user_id
      and m.logged_at >= a.started_at - interval '30 days'
      and m.logged_at < a.started_at
  ) b
  cross join lateral (
    select avg(m.score) as average, count(*) as entries
    from public.mood_entries m
    where m.user_id = a.user_id
      and m.logged_at >= a.started_at
      and m.logged_at < least(coalesce(a.ended_at, now()), a.started_at + make_interval(days => j.length_days))
  ) d
  where a.user_id = (select auth.uid());
$$;

revoke execute on function public.create_journey, public.journey_attempt_moods from public, anon;
grant execute on function public.create_journey, public.journey_attempt_moods to authenticated;
