-- Row Level Security. Enabled on every table — nothing in this app is
-- reachable without an explicit policy. This is what makes the old app's
-- "admin bypass via sessionStorage" and "delete doesn't persist" bugs
-- structurally impossible: there is no client code path that can violate
-- these policies, only the database enforces them.

alter table public.profiles                enable row level security;
alter table public.worker_profiles          enable row level security;
alter table public.worker_projects          enable row level security;
alter table public.worker_certifications    enable row level security;
alter table public.worker_references        enable row level security;
alter table public.employer_profiles        enable row level security;
alter table public.jobs                     enable row level security;
alter table public.applications             enable row level security;
alter table public.blog_posts               enable row level security;
alter table public.site_content             enable row level security;
alter table public.newsletter_subscribers   enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- Prevent a non-admin from granting themselves a different role via the
-- update policy above (RLS's WITH CHECK can't diff old vs new values, so
-- this is enforced with a trigger instead).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- No client-side insert policy: rows are created exclusively by the
-- handle_new_user() trigger (SECURITY DEFINER), which bypasses RLS.
-- No delete policy: profiles are removed via auth.users cascade only.

-- ---------------------------------------------------------------------------
-- worker_profiles (public read for search; owner or admin writes)
-- ---------------------------------------------------------------------------
create policy "worker_profiles_select_public"
  on public.worker_profiles for select
  using (true);

create policy "worker_profiles_insert_own"
  on public.worker_profiles for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'WORKER')
  );

create policy "worker_profiles_update_own_or_admin"
  on public.worker_profiles for update
  using (user_id = auth.uid() or public.is_admin());

create policy "worker_profiles_delete_admin_only"
  on public.worker_profiles for delete
  using (public.is_admin());

-- worker_projects / worker_certifications / worker_references share the same
-- shape: public read, writes gated by ownership of the parent worker_profile.
create policy "worker_projects_select_public"
  on public.worker_projects for select using (true);
create policy "worker_projects_write_owner_or_admin"
  on public.worker_projects for all
  using (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  );

create policy "worker_certifications_select_public"
  on public.worker_certifications for select using (true);
create policy "worker_certifications_write_owner_or_admin"
  on public.worker_certifications for all
  using (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  );

create policy "worker_references_select_public"
  on public.worker_references for select using (true);
create policy "worker_references_write_owner_or_admin"
  on public.worker_references for all
  using (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or worker_id in (select id from public.worker_profiles where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- employer_profiles (public read; owner or admin writes)
-- ---------------------------------------------------------------------------
create policy "employer_profiles_select_public"
  on public.employer_profiles for select
  using (true);

create policy "employer_profiles_insert_own"
  on public.employer_profiles for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'EMPLOYER')
  );

create policy "employer_profiles_update_own_or_admin"
  on public.employer_profiles for update
  using (user_id = auth.uid() or public.is_admin());

create policy "employer_profiles_delete_admin_only"
  on public.employer_profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- jobs (public read of Active jobs; owner sees/manages their own regardless
-- of status; admin sees/manages everything)
-- ---------------------------------------------------------------------------
create policy "jobs_select_active_or_owner_or_admin"
  on public.jobs for select
  using (status = 'Active' or employer_id = auth.uid() or public.is_admin());

create policy "jobs_insert_own"
  on public.jobs for insert
  with check (
    employer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'EMPLOYER')
  );

create policy "jobs_update_own_or_admin"
  on public.jobs for update
  using (employer_id = auth.uid() or public.is_admin());

create policy "jobs_delete_own_or_admin"
  on public.jobs for delete
  using (employer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- applications (visible to the applicant, the job's employer, or admin)
-- ---------------------------------------------------------------------------
create policy "applications_select_participant_or_admin"
  on public.applications for select
  using (worker_id = auth.uid() or employer_id = auth.uid() or public.is_admin());

create policy "applications_insert_own"
  on public.applications for insert
  with check (
    worker_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'WORKER')
  );

-- Status transitions are validated at the application layer (services/db.ts);
-- both participants may update shared fields (e.g. status) on their own
-- application/job.
create policy "applications_update_participant_or_admin"
  on public.applications for update
  using (worker_id = auth.uid() or employer_id = auth.uid() or public.is_admin());

create policy "applications_delete_admin_only"
  on public.applications for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- blog_posts / site_content (public read, admin-only writes)
-- ---------------------------------------------------------------------------
create policy "blog_posts_select_public"
  on public.blog_posts for select using (true);
create policy "blog_posts_write_admin_only"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "site_content_select_public"
  on public.site_content for select using (true);
create policy "site_content_write_admin_only"
  on public.site_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- newsletter_subscribers (anyone can subscribe; only admins can read/manage)
-- ---------------------------------------------------------------------------
create policy "newsletter_insert_anyone"
  on public.newsletter_subscribers for insert
  with check (true);

create policy "newsletter_select_admin_only"
  on public.newsletter_subscribers for select
  using (public.is_admin());

create policy "newsletter_delete_admin_only"
  on public.newsletter_subscribers for delete
  using (public.is_admin());
