-- EZJOB core schema
-- Replaces the Firestore collections described in instructions/03-firestore-schema.md
-- with real Postgres tables + foreign keys + constraints.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, id == auth.users.id
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  identifier  text not null,
  role        text not null check (role in ('WORKER', 'EMPLOYER', 'ADMIN')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- worker_profiles: the "Skill Passport"
-- ---------------------------------------------------------------------------
create table public.worker_profiles (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references public.profiles(id) on delete cascade,
  full_name              text not null,
  trade_or_skill         text not null default 'General',
  experience_years       integer not null default 0,
  cv_url                 text,
  summary                text,
  bio                    text,
  composite_score        integer,
  country_of_origin      text not null default 'Unknown',
  experience_in_country  integer not null default 0,
  photo_url              text,
  status                 text not null default 'Active' check (status in ('Active', 'Suspended')),
  physical_attributes    jsonb not null default '{}'::jsonb,
  media_links            jsonb not null default '{}'::jsonb,
  trade_specifics        jsonb not null default '{}'::jsonb,
  history                jsonb not null default '{}'::jsonb,
  is_verified            boolean not null default false,
  skills                 jsonb not null default '[]'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index worker_profiles_status_idx on public.worker_profiles (status);
create index worker_profiles_country_idx on public.worker_profiles (country_of_origin);

create table public.worker_projects (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.worker_profiles(id) on delete cascade,
  project_name  text not null,
  role          text not null,
  year_start    integer,
  year_end      integer,
  description   text,
  created_at    timestamptz not null default now()
);

create table public.worker_certifications (
  id             uuid primary key default gen_random_uuid(),
  worker_id      uuid not null references public.worker_profiles(id) on delete cascade,
  cert_name      text not null,
  expiry_date    date,
  document_url   text,
  created_at     timestamptz not null default now()
);

create table public.worker_references (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.worker_profiles(id) on delete cascade,
  name          text not null,
  contact       text,
  relationship  text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- employer_profiles
-- ---------------------------------------------------------------------------
create table public.employer_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.profiles(id) on delete cascade,
  company_name       text not null,
  description        text,
  website_url        text,
  phone              text,
  industry           text,
  location           text,
  company_size       text,
  year_founded       integer,
  company_logo_url   text,
  status             text not null default 'Active' check (status in ('Active', 'Suspended')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  employer_id      uuid not null references public.profiles(id) on delete cascade,
  employer_name    text not null,
  title            text not null,
  description      text not null default '',
  required_skills  text[] not null default '{}',
  status           text not null default 'Active' check (status in ('Active', 'On Hold', 'Closed')),
  location         text not null default '',
  country          text not null default '',
  salary_min       integer not null default 0,
  salary_max       integer not null default 0,
  currency         text default 'SGD',
  created_at       timestamptz not null default now(),
  constraint jobs_salary_range_ck check (salary_max >= salary_min)
);
create index jobs_status_idx on public.jobs (status);
create index jobs_employer_id_idx on public.jobs (employer_id);

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  worker_id       uuid not null references public.profiles(id) on delete cascade,
  employer_id     uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'Submitted'
                    check (status in ('Submitted', 'Viewed', 'Shortlisted', 'Rejected', 'Withdrawn')),
  job_title       text not null,
  employer_name   text not null,
  location        text not null default '',
  applied_at      timestamptz not null default now(),
  unique (job_id, worker_id)
);
create index applications_worker_id_idx on public.applications (worker_id);
create index applications_employer_id_idx on public.applications (employer_id);
create index applications_job_id_idx on public.applications (job_id);

-- ---------------------------------------------------------------------------
-- blog_posts
-- ---------------------------------------------------------------------------
create table public.blog_posts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  content        text not null default '',
  image_url      text,
  author         text not null default '',
  publish_date   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- site_content: one consistent jsonb blob per CMS-managed content key
-- (replaces the array-wrapped-vs-bare-object inconsistency in the old
--  Firestore siteContent collection)
-- ---------------------------------------------------------------------------
create table public.site_content (
  id          text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);
