-- "Läs och svara": a moment type for fact subjects (SO, NO …) without levels.
-- The student reads the material, answers a round of questions and writes
-- texts that get AI feedback. Stars: read · quiz passed · writing approved.

create type public.moment_mode as enum ('levels', 'read');
alter table public.moments add column mode public.moment_mode not null default 'levels';

-- Reading sections (in addition to the intro) – always readable.
alter type public.content_block_type add value if not exists 'reading';

-- Milestones for read moments; stars = number of milestones reached.
alter table public.moment_progress
  add column read_at timestamptz,
  add column quiz_passed_at timestamptz,
  add column writing_approved_at timestamptz;

create type public.writing_verdict as enum ('approved', 'almost', 'not_yet');

create table public.writing_tasks (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments (id) on delete cascade,
  prompt_md text not null,
  -- The student must write at least this many characters before sending.
  min_chars integer not null default 300 check (min_chars between 50 and 5000),
  -- What a good answer should contain; guides the AI. Never shown to students.
  rubric_md text not null default '',
  status public.task_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index writing_tasks_moment_idx on public.writing_tasks (moment_id, sort_order);
create trigger writing_tasks_updated_at before update on public.writing_tasks
  for each row execute function public.set_updated_at();

create table public.writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  writing_task_id uuid not null references public.writing_tasks (id) on delete cascade,
  moment_id uuid not null references public.moments (id) on delete cascade,
  body text not null,
  char_count integer not null,
  verdict public.writing_verdict,
  feedback_md text,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  created_at timestamptz not null default now()
);

create index writing_submissions_user_idx on public.writing_submissions (user_id, writing_task_id, created_at desc);

alter table public.writing_tasks enable row level security;
alter table public.writing_submissions enable row level security;
revoke all on public.writing_tasks, public.writing_submissions from anon;

-- The prompt is public to students, the rubric is not: students get writing
-- tasks through the server (like tasks), so the table is admin-only.
create policy "writing_tasks: admin only" on public.writing_tasks
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Submissions are created server-side (AI feedback); students read their own.
create policy "writing_submissions: read own or admin" on public.writing_submissions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
