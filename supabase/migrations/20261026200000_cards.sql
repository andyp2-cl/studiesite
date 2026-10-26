-- Collectible cards (lib/cards/catalog.ts) replace the monsters. Each student
-- collects one theme, set by the admin. A card is earned for a milestone
-- (an area cleared at a level, a fact area finished), at most once per
-- milestone. Students read their own; only the server writes.
alter table public.profiles
  add column collection_theme text not null default 'football' check (collection_theme in ('football', 'music'));

comment on column public.profiles.collection_theme is 'Which card series the student collects: football players or music artists.';

create table public.user_cards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  theme text not null check (theme in ('football', 'music')),
  card_id smallint not null check (card_id between 1 and 5000),
  milestone text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, theme, card_id),
  unique (user_id, milestone)
);

alter table public.user_cards enable row level security;
revoke all on public.user_cards from anon;
revoke insert, update, delete on public.user_cards from authenticated;

create policy "user_cards: read own or admin" on public.user_cards
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
