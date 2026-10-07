-- Journal: longer free-text entries, plus read-only functions that build the
-- Journal feed (check-in notes and longer entries grouped by local day).

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  written_at timestamptz not null default now(),
  body text not null check (char_length(btrim(body)) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.journal_entries is 'Longer entries written from the Journal ("Write something longer").';

create index journal_entries_user_written_at_idx on public.journal_entries (user_id, written_at desc);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;

create policy "Journal entries are readable by their owner"
  on public.journal_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Journal entries are insertable by their owner"
  on public.journal_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Journal entries are editable by their owner"
  on public.journal_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Journal entries are deletable by their owner"
  on public.journal_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ── Feed ──────────────────────────────────────────────────────────────
-- Every check-in and longer entry on the next `p_days` local days (before
-- `p_before`) that contain at least one item matching the filters. Items that
-- don't match are returned too, flagged, because the day rail summarises the
-- whole day. Longer entries only match a text search (they have no mood or tags).
-- Security invoker: RLS limits rows to the caller's own.
create function public.journal_feed(
  p_time_zone text,
  p_before date default null,
  p_days integer default 8,
  p_query text default '',
  p_tag text default null,
  p_level smallint default null,
  p_notes_only boolean default true
)
returns table (
  kind text,
  id uuid,
  at timestamptz,
  day date,
  level smallint,
  score smallint,
  body text,
  tags text[],
  matches boolean
)
language sql
stable
set search_path = ''
as $$
  with params as (
    select
      nullif(btrim(coalesce(p_query, '')), '') as q,
      -- Before midnight of p_before, in the user's zone (null = no bound).
      (p_before::timestamp at time zone p_time_zone) as until
  ),
  pattern as (
    select '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%' as like_q, q, until
    from params
  ),
  items as (
    select
      'check-in'::text as kind, m.id, m.logged_at as at,
      (m.logged_at at time zone p_time_zone)::date as day,
      m.level, m.score, m.note as body, m.tags,
      (
        (not p_notes_only or m.note <> '')
        and (p.q is null or m.note ilike p.like_q)
        and (p_tag is null or p_tag = any (m.tags))
        and (p_level is null or m.level = p_level)
      ) as matches
    from public.mood_entries m, pattern p
    where m.user_id = (select auth.uid())
      and (p.until is null or m.logged_at < p.until)
    union all
    select
      'long', j.id, j.written_at,
      (j.written_at at time zone p_time_zone)::date,
      null, null, j.body, '{}'::text[],
      (p_tag is null and p_level is null and (p.q is null or j.body ilike p.like_q))
    from public.journal_entries j, pattern p
    where j.user_id = (select auth.uid())
      and (p.until is null or j.written_at < p.until)
  ),
  days as (
    select distinct i.day
    from items i
    where i.matches
    order by i.day desc
    limit least(greatest(p_days, 1), 60)
  )
  select i.kind, i.id, i.at, i.day, i.level, i.score, i.body, i.tags, i.matches
  from items i
  where i.day in (select d.day from days d)
  order by i.at, i.id;
$$;

comment on function public.journal_feed is 'Journal feed page: all items on the next p_days days that have a match.';

-- Per-month check-in totals (month headers, the "N notes since …" line).
create function public.journal_months(p_time_zone text)
returns table (month date, entries bigint, notes bigint, average numeric)
language sql
stable
set search_path = ''
as $$
  select
    date_trunc('month', m.logged_at at time zone p_time_zone)::date as month,
    count(*) as entries,
    count(*) filter (where m.note <> '') as notes,
    round(avg(m.score), 2) as average
  from public.mood_entries m
  where m.user_id = (select auth.uid())
  group by 1
  order by 1;
$$;

-- Tags on noted check-ins, most used first (the Journal's tag filter).
create function public.journal_tags(p_limit integer default 7)
returns table (tag text, entries bigint)
language sql
stable
set search_path = ''
as $$
  select t.tag, count(*) as entries
  from public.mood_entries m, unnest(m.tags) as t (tag)
  where m.user_id = (select auth.uid()) and m.note <> ''
  group by t.tag
  order by count(*) desc, t.tag
  limit least(greatest(p_limit, 1), 50);
$$;

revoke execute on function public.journal_feed, public.journal_months, public.journal_tags from public, anon;
grant execute on function public.journal_feed, public.journal_months, public.journal_tags to authenticated;
