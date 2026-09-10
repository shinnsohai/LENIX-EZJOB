-- Async translation workflow + position-fulfillment tracking.
--
-- Translations are NOT generated in-app. The intended workflow (per product
-- decision) is: employer exports their jobs to CSV from the webapp, runs an
-- LLM translation/optimization pass on it offline a few times a week, then
-- re-imports the translated CSV. The webapp's job is only to store the
-- result and let candidates switch locale — never to call an LLM itself for
-- this. `translations` is a flexible jsonb map so new languages need no
-- further migration: { "<lang-code>": { "title": "...", "description": "...",
-- "required_skills": ["..."], "shift_schedule": "...", "perks": "...",
-- "qualifying_questions": ["..."] } }.
--
-- Fulfillment: `available_positions` is set by the employer when posting
-- (nullable = not tracked, matching every existing job). `positions_filled`
-- is never written directly by the client — it's maintained by the trigger
-- below off the applications table, the same trigger-enforced-invariant
-- pattern as prevent_role_escalation.

alter table public.jobs
  add column translations        jsonb not null default '{}'::jsonb,
  add column available_positions integer,
  add column positions_filled    integer not null default 0;

alter table public.applications drop constraint applications_status_check;

alter table public.applications add constraint applications_status_check
  check (status in ('Submitted', 'Viewed', 'Shortlisted', 'Rejected', 'Withdrawn', 'Hired'));

create or replace function public.sync_job_positions_filled()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status = 'Hired' and old.status is distinct from 'Hired' then
    update public.jobs set positions_filled = positions_filled + 1, status = case when available_positions is not null and positions_filled + 1 >= available_positions then 'Closed' else status end where id = new.job_id;
  elsif tg_op = 'UPDATE' and old.status = 'Hired' and new.status is distinct from 'Hired' then
    update public.jobs set positions_filled = greatest(0, positions_filled - 1) where id = new.job_id;
  end if;
  return new;
end;
$$;

create trigger applications_sync_job_positions after update of status on public.applications for each row execute function public.sync_job_positions_filled();
