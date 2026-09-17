-- In-app notification module, delivered in real time via Supabase Realtime
-- (no browser push / service worker — see the app's notification bell,
-- which subscribes to this table). Fired when an applicant's status
-- changes (Shortlisted / Hired / Rejected) and when a worker applies to a
-- job, for both worker and employer accounts.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid() or public.is_admin());

-- Recipients never insert their own notifications — only the counterparty
-- in a real application relationship may create one for them, mirroring the
-- worker_id/employer_id ownership checks already used on applications.
create policy "notifications_insert_by_counterparty"
  on public.notifications for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.applications a
      where a.employer_id = auth.uid() and a.worker_id = notifications.user_id
    )
    or exists (
      select 1 from public.applications a
      where a.worker_id = auth.uid() and a.employer_id = notifications.user_id
    )
  );

create policy "notifications_delete_own_or_admin"
  on public.notifications for delete
  using (user_id = auth.uid() or public.is_admin());

-- Idempotent: only add to the realtime publication if not already present.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
