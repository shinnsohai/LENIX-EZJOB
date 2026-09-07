-- Support for OAuth sign-in (Google, etc.) alongside the existing
-- email/password flow.
--
-- Email/password registration passes `role` explicitly via signUp()'s
-- metadata, so handle_new_user() already knows the correct role at insert
-- time. OAuth sign-in (Google) has no such step -- the identity comes from
-- the provider, not from us -- so a brand-new OAuth user has no way to say
-- "I'm a worker" vs "I'm an employer" before the account already exists.
--
-- role_locked tracks whether the role has been deliberately chosen yet:
--   * true  -> set at insert time for signUp() users (they chose at
--              registration); after that, role changes require an admin
--              (prevent_role_escalation, unchanged for these accounts).
--   * false -> set at insert time for OAuth users (role defaults to
--              WORKER as a placeholder); the client is allowed exactly one
--              self-service correction to WORKER/EMPLOYER (never ADMIN),
--              which also flips role_locked to true. After that, the
--              normal admin-only rule applies forever, same as everyone
--              else.

alter table public.profiles
  add column role_locked boolean not null default true;

-- Backfill: every profile that already exists went through the
-- email/password flow, so it already made its choice.
update public.profiles set role_locked = true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, identifier, role, role_locked)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'identifier', new.email, new.id::text),
    coalesce(new.raw_user_meta_data ->> 'role', 'WORKER'),
    -- Locked immediately if a real signup supplied a role; left open for a
    -- one-time client-side correction when it didn't (OAuth path).
    (new.raw_user_meta_data ->> 'role') is not null
  );
  return new;
end;
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new; -- admins can freely change role and/or role_locked
  end if;

  -- Once locked, a non-admin can never change the role NOR unlock it again
  -- (closes the "flip role_locked to false in one request, change role in
  -- the next" bypass -- both columns must move together, in one direction).
  if old.role_locked then
    if new.role <> old.role or new.role_locked <> old.role_locked then
      raise exception 'Only an admin can change a user role';
    end if;
    return new;
  end if;

  -- old.role_locked = false: the one-time self-service window (OAuth's
  -- post-signup role pick). Only WORKER/EMPLOYER, and the same statement
  -- must lock it -- there is no way to change role without also locking.
  if new.role <> old.role then
    if new.role not in ('WORKER', 'EMPLOYER') then
      raise exception 'Only an admin can grant admin access';
    end if;
    if not new.role_locked then
      raise exception 'Role selection must lock itself on the first self-service change';
    end if;
  end if;

  return new;
end;
$$;
