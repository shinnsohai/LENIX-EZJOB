-- SECURITY FIX: handle_new_user() previously copied `role` straight from
-- raw_user_meta_data. That metadata is whatever the caller passes to the
-- public signUp() endpoint (options.data), so anyone could self-register as
-- ADMIN with the public anon key. Only WORKER / EMPLOYER may be chosen at
-- signup; anything else (including ADMIN) falls back to the WORKER
-- placeholder with role_locked = false, same as an OAuth user.
--
-- Accounts created server-side with the service-role key (e.g. the admin
-- "create company" endpoint) still pass role EMPLOYER and are unaffected.
-- ADMIN accounts must be granted by an existing admin or via SQL.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  -- coalesce: a missing role (OAuth signup) makes `in` yield NULL, and
  -- role_locked is NOT NULL.
  allowed boolean := coalesce(requested_role in ('WORKER', 'EMPLOYER'), false);
begin
  insert into public.profiles (id, identifier, role, role_locked)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'identifier', new.email, new.id::text),
    case when allowed then requested_role else 'WORKER' end,
    allowed
  );
  return new;
end;
$$;

-- Audit helper (read-only): lists every ADMIN so you can confirm none were
-- created through the old hole. Run it separately after applying the fix:
--   select id, identifier, created_at from public.profiles where role = 'ADMIN';
