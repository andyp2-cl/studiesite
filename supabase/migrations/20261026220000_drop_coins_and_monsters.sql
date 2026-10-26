-- Cards (user_cards) are the only reward now. Drop what the coin economy used:
-- coins on profiles and XP events, the monster collection and the old reward
-- shop. Run after the code that no longer reads these is deployed.
drop table if exists public.user_monsters;
drop table if exists public.reward_redemptions;
drop table if exists public.rewards;

alter table public.profiles drop column if exists coins;
alter table public.xp_events drop column if exists coins;
