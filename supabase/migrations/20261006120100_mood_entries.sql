-- Mood check-ins. Tags are stored on the entry as text[]: writes stay atomic
-- (one row per check-in) and tag analytics work with unnest().

create table public.mood_entries (
  -- Client-generated so the UI can update optimistically without an id swap.
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  -- The mood tapped (1 Sad … 5 Great) and its intensity.
  level smallint not null check (level between 1 and 5),
  score smallint not null check (score between 1 and 10),
  note text not null default '' check (char_length(note) <= 2000),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mood_entries is 'One row per mood check-in.';

create index mood_entries_user_logged_at_idx on public.mood_entries (user_id, logged_at desc);
create index mood_entries_tags_idx on public.mood_entries using gin (tags);

create trigger mood_entries_set_updated_at
  before update on public.mood_entries
  for each row execute function public.set_updated_at();

alter table public.mood_entries enable row level security;

create policy "Mood entries are readable by their owner"
  on public.mood_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Mood entries are insertable by their owner"
  on public.mood_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Mood entries are editable by their owner"
  on public.mood_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Mood entries are deletable by their owner"
  on public.mood_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);
