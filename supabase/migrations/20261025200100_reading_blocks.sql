-- Reading sections have no unlock level and are readable like the intro.
alter table public.content_blocks drop constraint content_blocks_check;
alter table public.content_blocks add constraint content_blocks_check check (
  (type in ('intro', 'reading') and unlock_level is null)
  or (type = 'deepening' and unlock_level is not null)
);

drop policy "content_blocks: read unlocked" on public.content_blocks;
create policy "content_blocks: read unlocked" on public.content_blocks
  for select to authenticated
  using (
    (select public.is_admin())
    or type in ('intro', 'reading')
    or exists (
      select 1 from public.moment_progress mp
      where mp.user_id = (select auth.uid())
        and mp.moment_id = content_blocks.moment_id
        and mp.stars >= content_blocks.unlock_level
    )
  );
