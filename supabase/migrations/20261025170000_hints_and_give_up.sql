-- Hints and "ge mig svaret": recorded per attempt so results and statistics
-- show whether the student needed help.
alter table public.attempts
  add column used_hint boolean not null default false,
  add column gave_up boolean not null default false;

-- Optional hint for admin-written tasks (generated tasks build their own).
alter table public.tasks
  add column hint_md text;
