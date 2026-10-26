-- Collectible monsters (lib/monsters/catalog.ts): which ones each student has
-- and how many. Students read their own; only the server writes, because a
-- pack costs coins.
create table public.user_monsters (
  user_id uuid not null references public.profiles (id) on delete cascade,
  monster_id smallint not null check (monster_id between 1 and 500),
  count integer not null default 1 check (count >= 1),
  first_at timestamptz not null default now(),
  primary key (user_id, monster_id)
);

alter table public.user_monsters enable row level security;
revoke all on public.user_monsters from anon;
revoke insert, update, delete on public.user_monsters from authenticated;

create policy "user_monsters: read own or admin" on public.user_monsters
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
