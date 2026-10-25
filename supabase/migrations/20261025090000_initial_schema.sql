-- Studiesite: initial schema (SPEC.md section 11).
-- Writes that affect XP, coins, progress and attempts are done server-side
-- with the service role after the answer has been checked; students only read.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'student');
create type public.content_block_type as enum ('intro', 'deepening');
create type public.moment_source as enum ('generator', 'tasks');
create type public.task_type as enum ('numeric', 'expression', 'multiple_choice', 'true_false', 'free_text');
create type public.task_status as enum ('draft', 'published');
create type public.task_origin as enum ('admin', 'ai');
create type public.redemption_status as enum ('pending', 'approved', 'denied');
create type public.upload_status as enum ('uploaded', 'processing', 'ready', 'failed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.-]{2,32}$'),
  display_name text not null,
  role public.user_role not null default 'student',
  avatar text,
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  level integer not null default 1 check (level >= 1),
  streak integer not null default 0 check (streak >= 0),
  streak_freezes integer not null default 1 check (streak_freezes >= 0),
  -- Monday of the week the freeze was last refilled (one freeze per week).
  freeze_refilled_week date,
  last_active_date date,
  sound_enabled boolean not null default false,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every auth user gets a profile. Username/display name come from user
-- metadata; role comes from app_metadata, which only the service role can set.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    lower(v_username),
    coalesce(new.raw_user_meta_data ->> 'display_name', v_username),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Content hierarchy: subject -> area -> moment
-- ---------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  color text not null default '#1ed760',
  icon text not null default 'book',
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  color text not null default '#1ed760',
  icon text not null default 'book',
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);

create table public.moments (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  source public.moment_source not null default 'generator',
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (area_id, slug)
);

create index areas_subject_idx on public.areas (subject_id, sort_order);
create index moments_area_idx on public.moments (area_id, sort_order);

create trigger subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger areas_updated_at before update on public.areas
  for each row execute function public.set_updated_at();
create trigger moments_updated_at before update on public.moments
  for each row execute function public.set_updated_at();

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments (id) on delete cascade,
  type public.content_block_type not null,
  title text,
  body_md text not null default '',
  -- Level (1 = Lätt, 2 = Medel, 3 = Svår) that must be cleared to unlock a deepening.
  unlock_level smallint check (unlock_level between 1 and 3),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'intro' and unlock_level is null) or (type = 'deepening' and unlock_level is not null))
);

create index content_blocks_moment_idx on public.content_blocks (moment_id, sort_order);
create trigger content_blocks_updated_at before update on public.content_blocks
  for each row execute function public.set_updated_at();

create table public.generators (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null unique references public.moments (id) on delete cascade,
  -- Matches lib/generators/<area>/<moment>.ts, e.g. 'fractions/expand-simplify'.
  generator_key text not null,
  -- { "1": {...}, "2": {...}, "3": {...} }; empty means the generator's defaults.
  params_per_level jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger generators_updated_at before update on public.generators
  for each row execute function public.set_updated_at();

-- Fixed tasks. Contains the answer key, so students never read this table directly.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments (id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  type public.task_type not null,
  prompt_md text not null,
  answer jsonb not null,
  choices jsonb,
  solution_md text,
  status public.task_status not null default 'draft',
  source public.task_origin not null default 'admin',
  upload_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_moment_idx on public.tasks (moment_id, level, status);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Progress
-- ---------------------------------------------------------------------------
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  moment_id uuid not null references public.moments (id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  task_id uuid references public.tasks (id) on delete set null,
  generator_key text,
  generator_seed bigint,
  answer text not null,
  correct boolean not null,
  explanation_text text,
  -- True when the attempt was part of "Dagens mix".
  from_mix boolean not null default false,
  duration_ms integer check (duration_ms >= 0),
  created_at timestamptz not null default now(),
  check (task_id is not null or generator_seed is not null)
);

create index attempts_user_moment_idx on public.attempts (user_id, moment_id, level, created_at desc);
create index attempts_user_created_idx on public.attempts (user_id, created_at desc);

create table public.moment_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  moment_id uuid not null references public.moments (id) on delete cascade,
  stars smallint not null default 0 check (stars between 0 and 3),
  current_level smallint not null default 1 check (current_level between 1 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, moment_id)
);

create trigger moment_progress_updated_at before update on public.moment_progress
  for each row execute function public.set_updated_at();

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  coins integer not null default 0,
  reason text not null,
  attempt_id uuid references public.attempts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index xp_events_user_created_idx on public.xp_events (user_id, created_at desc);
create index xp_events_created_idx on public.xp_events (created_at);

-- ---------------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  icon text not null default 'trophy',
  -- Evaluated in code, e.g. {"type": "correct_total", "count": 100}.
  rule jsonb not null,
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- Reward shop
-- ---------------------------------------------------------------------------
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text not null default 'gift',
  price integer not null check (price > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reward_id uuid not null references public.rewards (id) on delete restrict,
  price integer not null check (price > 0),
  status public.redemption_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null
);

create index reward_redemptions_status_idx on public.reward_redemptions (status, created_at);

-- ---------------------------------------------------------------------------
-- Phase 2: uploads (PDF/photo -> AI-generated draft tasks)
-- ---------------------------------------------------------------------------
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  area_id uuid references public.areas (id) on delete set null,
  storage_path text not null,
  mime_type text not null,
  status public.upload_status not null default 'uploaded',
  error text,
  created_at timestamptz not null default now()
);

alter table public.tasks
  add constraint tasks_upload_fk foreign key (upload_id) references public.uploads (id) on delete set null;

-- ---------------------------------------------------------------------------
-- AI usage and settings
-- ---------------------------------------------------------------------------
create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  purpose text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index ai_calls_created_idx on public.ai_calls (created_at);
create index ai_calls_user_created_idx on public.ai_calls (user_id, created_at);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (key, value) values
  ('daily_goal_xp', '50'),
  ('ai_monthly_budget_usd', '5'),
  ('ai_feedback_daily_limit', '5');

-- ---------------------------------------------------------------------------
-- Leaderboard: only public fields of students. Weeks start on Monday,
-- Swedish time.
-- ---------------------------------------------------------------------------
create function public.get_leaderboard(p_period text default 'week')
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
  select
    p.id,
    p.display_name,
    p.avatar,
    p.level,
    p.streak,
    case
      when p_period = 'all' then p.xp::bigint
      else coalesce((
        select sum(e.amount)
        from public.xp_events e
        where e.user_id = p.id
          and e.created_at >= (date_trunc('week', now() at time zone 'Europe/Stockholm') at time zone 'Europe/Stockholm')
      ), 0)::bigint
    end as xp
  from public.profiles p
  where p.role = 'student'
    and (select auth.uid()) is not null
  order by xp desc, p.display_name;
$$;

revoke execute on function public.get_leaderboard(text) from public, anon;
grant execute on function public.get_leaderboard(text) to authenticated;
