-- Row Level Security for every table.
-- Principle: students read their own data and visible content. Everything that
-- awards XP/coins or records progress is written by the server (service role,
-- which bypasses RLS) after the answer has been checked. Admins can do anything.

-- Nothing in this app is public: the anon role gets no table access at all.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.areas enable row level security;
alter table public.moments enable row level security;
alter table public.content_blocks enable row level security;
alter table public.generators enable row level security;
alter table public.tasks enable row level security;
alter table public.attempts enable row level security;
alter table public.moment_progress enable row level security;
alter table public.xp_events enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.uploads enable row level security;
alter table public.ai_calls enable row level security;
alter table public.settings enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles: own row (others only via get_leaderboard). Students may change
-- only cosmetic columns; XP, coins, role etc. are server-controlled.
-- ---------------------------------------------------------------------------
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, avatar, sound_enabled, theme) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Content: everyone signed in reads visible content; admins manage it.
-- ---------------------------------------------------------------------------
create policy "subjects: read visible" on public.subjects
  for select to authenticated
  using (not is_hidden or (select public.is_admin()));
create policy "subjects: admin write" on public.subjects
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "areas: read visible" on public.areas
  for select to authenticated
  using (not is_hidden or (select public.is_admin()));
create policy "areas: admin write" on public.areas
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "moments: read visible" on public.moments
  for select to authenticated
  using (not is_hidden or (select public.is_admin()));
create policy "moments: admin write" on public.moments
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Intros are always readable; a deepening only once its level is cleared.
create policy "content_blocks: read unlocked" on public.content_blocks
  for select to authenticated
  using (
    (select public.is_admin())
    or type = 'intro'
    or exists (
      select 1 from public.moment_progress mp
      where mp.user_id = (select auth.uid())
        and mp.moment_id = content_blocks.moment_id
        and mp.stars >= content_blocks.unlock_level
    )
  );
create policy "content_blocks: admin write" on public.content_blocks
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "generators: read" on public.generators
  for select to authenticated using (true);
create policy "generators: admin write" on public.generators
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Tasks hold the answer key: admin only. Students get tasks via the server.
create policy "tasks: admin only" on public.tasks
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Progress: read own, admin reads all. Writes happen server-side.
-- ---------------------------------------------------------------------------
create policy "attempts: read own or admin" on public.attempts
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "moment_progress: read own or admin" on public.moment_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "xp_events: read own or admin" on public.xp_events
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------------
create policy "achievements: read" on public.achievements
  for select to authenticated
  using (not is_hidden or (select public.is_admin()));
create policy "achievements: admin write" on public.achievements
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "user_achievements: read own or admin" on public.user_achievements
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Rewards
-- ---------------------------------------------------------------------------
create policy "rewards: read active" on public.rewards
  for select to authenticated
  using (is_active or (select public.is_admin()));
create policy "rewards: admin write" on public.rewards
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Purchases deduct coins, so they are created server-side.
create policy "reward_redemptions: read own or admin" on public.reward_redemptions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reward_redemptions: admin update" on public.reward_redemptions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Admin-only tables
-- ---------------------------------------------------------------------------
create policy "uploads: admin only" on public.uploads
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "ai_calls: admin read" on public.ai_calls
  for select to authenticated
  using ((select public.is_admin()));

create policy "settings: read" on public.settings
  for select to authenticated using (true);
create policy "settings: admin write" on public.settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
