-- Show the streak as it stands today: a streak whose last goal day is older
-- than yesterday is broken, unless one missed day can still be saved by the
-- weekly freeze (same rule as currentStreak in lib/gamification.ts).
create or replace function public.get_leaderboard(p_period text default 'week')
returns table (
  user_id uuid,
  display_name text,
  avatar text,
  level integer,
  streak integer,
  xp bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with today as (
    select
      (now() at time zone 'Europe/Stockholm')::date as d,
      date_trunc('week', now() at time zone 'Europe/Stockholm')::date as monday
  )
  select
    p.id,
    p.display_name,
    p.avatar,
    p.level,
    case
      when p.last_active_date >= t.d - 1 then p.streak
      when p.last_active_date = t.d - 2
        and (p.streak_freezes > 0 or p.freeze_refilled_week is distinct from t.monday) then p.streak
      else 0
    end,
    case
      when p_period = 'all' then p.xp::bigint
      else coalesce((
        select sum(e.amount)
        from public.xp_events e
        where e.user_id = p.id
          and e.created_at >= (date_trunc('week', now() at time zone 'Europe/Stockholm') at time zone 'Europe/Stockholm')
      ), 0)::bigint
    end as xp
  from public.profiles p, today t
  where p.role = 'student'
    and (select auth.uid()) is not null
  order by xp desc, p.display_name;
$$;
