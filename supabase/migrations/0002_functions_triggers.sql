-- Helper functions + triggers.
-- search_path is pinned to '' on every SECURITY DEFINER function per Supabase's
-- RLS best-practice guidance, with all references schema-qualified.

-- ---------------------------------------------------------------------------
-- is_admin(): used throughout RLS policies as the admin-override check.
-- Reads the profiles table (not JWT claims, which a user could otherwise
-- tamper with) for the currently authenticated user.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user(): populates public.profiles automatically whenever a new
-- row is inserted into auth.users. The role + identifier are supplied via
-- the signUp() call's `options.data` (raw_user_meta_data). Defaults to
-- WORKER / the user's email if not supplied, so this never fails signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, identifier, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'identifier', new.email, new.id::text),
    coalesce(new.raw_user_meta_data ->> 'role', 'WORKER')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- generic updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger worker_profiles_set_updated_at
  before update on public.worker_profiles
  for each row execute function public.set_updated_at();

create trigger employer_profiles_set_updated_at
  before update on public.employer_profiles
  for each row execute function public.set_updated_at();

create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();
