-- Sources (links or pasted text) on an area, e.g. Karl XII. AI reads them to
-- draft moments; students see them as "Läs mer".
create type public.source_status as enum ('pending', 'ready', 'failed');

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas (id) on delete cascade,
  url text,
  title text not null,
  -- Readable text extracted from the page (or pasted by the admin).
  content text not null default '',
  status public.source_status not null default 'pending',
  error text,
  fetched_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (url is null or url ~ '^https?://')
);

create index sources_area_idx on public.sources (area_id, sort_order);

alter table public.sources enable row level security;
revoke all on public.sources from anon;

-- Titles and links are shown to students ("Läs mer"); nothing here is secret.
create policy "sources: read" on public.sources
  for select to authenticated using (true);
create policy "sources: admin write" on public.sources
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
