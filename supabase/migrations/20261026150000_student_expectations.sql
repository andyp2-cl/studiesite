-- Per-student expectations (an 11-year-old and a 13-year-old study the same
-- content but are held to different bars). Null means "use the site default".
-- Only the server (service role) writes these: they are not in the column
-- grant that lets students update their own cosmetic fields.
alter table public.profiles
  add column grade smallint check (grade between 1 and 9),
  add column daily_goal_xp integer check (daily_goal_xp between 10 and 500),
  add column pass_correct smallint check (pass_correct between 5 and 10);

comment on column public.profiles.grade is 'School year (årskurs), shown to the admin.';
comment on column public.profiles.daily_goal_xp is 'XP per day that keeps the streak; null = settings.daily_goal_xp.';
comment on column public.profiles.pass_correct is 'Correct answers of the latest 10 needed to clear a level or quiz; null = 8.';
