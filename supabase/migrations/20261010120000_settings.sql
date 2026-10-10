-- Settings (phase 10): timezone mode, the user's own tag list, and account deletion.

-- When true the timezone follows the browser (synced on load); when false the
-- user picked one in Settings and it stays put while travelling.
alter table public.profiles
  add column timezone_auto boolean not null default true;

-- Tags offered when logging a mood, in order. Null means the default list.
-- Existing entries keep their tags whatever happens to this list.
create function public.is_valid_tag_list(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(tags) <= 40
    and not exists (
      select 1 from pg_catalog.unnest(tags) as t
      where t is null or t <> pg_catalog.btrim(t) or pg_catalog.char_length(t) not between 1 and 32
    )
    and (select pg_catalog.count(distinct pg_catalog.lower(t)) from pg_catalog.unnest(tags) as t) = cardinality(tags);
$$;

alter table public.profiles
  add column tags text[],
  add constraint profiles_tags_valid check (tags is null or public.is_valid_tag_list(tags));

-- Deletes the caller's account. Every user table references auth.users with
-- on delete cascade, so check-ins, journal entries and journeys go with it.
-- Security definer because auth.users isn't writable by the authenticated
-- role; the only row it can touch is the caller's own.
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
