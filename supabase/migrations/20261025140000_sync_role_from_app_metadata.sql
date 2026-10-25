-- GoTrue's admin createUser inserts the auth user first and writes
-- app_metadata in a later update, so handle_new_user() never saw the role and
-- every account became a student. Keep profiles.role in sync with
-- app_metadata.role whenever it changes. Only the service role can write
-- app_metadata, so users cannot promote themselves this way.

create function public.sync_role_from_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := new.raw_app_meta_data ->> 'role';
begin
  if v_role in ('admin', 'student') then
    update public.profiles
    set role = v_role::public.user_role
    where id = new.id and role is distinct from v_role::public.user_role;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_app_metadata_changed
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function public.sync_role_from_app_metadata();

-- Fix accounts created before this migration.
update public.profiles p
set role = (u.raw_app_meta_data ->> 'role')::public.user_role
from auth.users u
where u.id = p.id
  and u.raw_app_meta_data ->> 'role' in ('admin', 'student')
  and p.role::text is distinct from u.raw_app_meta_data ->> 'role';
