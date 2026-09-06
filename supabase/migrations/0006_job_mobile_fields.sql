-- Mobile-first job posting fields for blue-collar/shift-based applicants:
-- shift schedule, perks, a WhatsApp quick-apply number, screening questions,
-- and transport/accommodation logistics. All nullable/defaulted so existing
-- jobs and the existing insert/update code paths keep working unchanged.

alter table public.jobs
  add column shift_schedule        text,
  add column perks                 text,
  add column whatsapp_number       text,
  add column qualifying_questions  text[] not null default '{}',
  add column transport_provided    boolean not null default false,
  add column transport_details     text,
  add column accommodation_provided boolean not null default false,
  add column accommodation_details text;
