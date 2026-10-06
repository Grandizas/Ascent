-- DEV ONLY: fills one account with 30 days of believable mood history
-- (3–5 check-ins a day, 07:30–23:30 in the account's timezone), so Today,
-- Timeline and Insights have something to show.
--
-- Usage: replace the email below, then run it in the Supabase SQL editor.
-- Running it twice adds a second set of entries.

do $$
declare
  target_email constant text := 'you@example.com';
  uid uuid;
  tz text;
  today date;
  n int;
  base numeric;
  s int;
  minute int;
  notes constant text[] := array[
    'Gym felt great.',
    'Didn’t sleep particularly well.',
    'Long meeting, drained afterwards.',
    'Walked outside for a bit. Helped.',
    'Quiet evening, read for an hour.',
    'Craving after lunch, passed quickly.'
  ];
  tags constant text[] := array['Work', 'Gym', 'Gaming', 'Tired', 'Good sleep', 'Social', 'Alone', 'Outside', 'Caffeine', 'Bored'];
begin
  select u.id, p.timezone into uid, tz
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.email = target_email;

  if uid is null then
    raise exception 'No account with email %', target_email;
  end if;

  today := (now() at time zone tz)::date;
  perform setseed(0.7);

  for d in 1..30 loop
    n := 3 + floor(random() * 3);
    base := 4.2 + random() * 2.4;
    for i in 1..n loop
      minute := 450 + floor(random() * 960);
      s := greatest(1, least(10, round(base + (random() - 0.5) * 4)));
      insert into public.mood_entries (user_id, logged_at, level, score, note, tags)
      values (
        uid,
        ((today - d)::timestamp + make_interval(mins => minute)) at time zone tz,
        case when s <= 2 then 1 when s <= 4 then 2 when s <= 6 then 3 when s <= 8 then 4 else 5 end,
        s,
        case when random() < 0.5 then notes[1 + floor(random() * array_length(notes, 1))::int] else '' end,
        case when random() < 0.7 then array[tags[1 + floor(random() * array_length(tags, 1))::int]] else '{}' end
      );
    end loop;
  end loop;
end $$;
