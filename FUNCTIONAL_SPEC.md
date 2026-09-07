# EZJOB by LENIX — Functional Regeneration Prompt

> **Purpose of this document**: a complete, implementation-ready specification of everything EZJOB *does* — data model, permissions, business rules, integrations, and user flows — as of the current build. It deliberately excludes visual/UI design (layout, color, typography, motion, component styling): treat this as "what to build," with "how it should look" left to a separate design pass. Use this as a standalone prompt to regenerate the functional layer of the app in any stack that supports the same primitives (Postgres + row-level auth, a serverless function layer for secrets, a JS/TS SPA or equivalent client).

## 1. Product summary

EZJOB is a job board connecting **skilled-trades/blue-collar workers** with **employers**, run by an operator ("LENIX", under holding company "Clarity E&C"), with a third **admin** role for platform operations. Three pillars:

1. **Worker "Skill Passport"** — a verified digital profile/resume (skills, projects, certifications, references, CV, photo) workers build once and use to apply to jobs.
2. **Employer job postings + applicant pipeline** — post jobs (with AI-assisted description generation), search the worker pool directly, and manage applicants through a status pipeline.
3. **Admin CMS** — full operational control: user management (including account deletion), blog content, and site copy/branding, without needing a code deploy.

Target users skew mobile-first and blue-collar for workers (shift-based jobs, WhatsApp-friendly contact, plain-language screening questions) and are a more conventional B2B/HR audience for employers.

## 2. Roles & authentication

Three roles, stored as `profiles.role`: `WORKER`, `EMPLOYER`, `ADMIN`. There is **no separate admin login system or hardcoded credential of any kind** — an admin is just a `profiles` row with `role = 'ADMIN'`, authenticated through the exact same email/password flow as everyone else. (An earlier version of this app had hardcoded demo credentials and a client-side `sessionStorage` flag that granted admin access with zero server verification — that is a security bug, not a feature, and must not be reintroduced in any form, including for "testing convenience.")

**Auth flow requirements:**
- Real email/password authentication only (no mock sessions, no "guess the role from the identifier string" logic, no silent fallback to a fake logged-in state when a real auth call fails). A failed login must fail, visibly.
- **Registration** collects the identifier (email) and a chosen role (`WORKER` or `EMPLOYER` — a user cannot self-register as `ADMIN`). On successful signup, a database-side trigger (not client code) creates the corresponding `profiles` row from the signup metadata, defaulting to `WORKER` if role metadata is somehow missing. This must run as a privileged/trusted operation the client cannot bypass or spoof — a client should never be able to write its own `role` into its profile row directly.
- **Role changes** (e.g. promoting a user to `ADMIN`) must only be possible by an already-verified admin, never by the user modifying their own row — enforce this at the data layer, not just in UI, so it holds even if someone calls the API directly.
- **Session resolution**: on load, resolve the current session, then fetch the matching profile row. Handle the brief race where a user just signed up and the profile-creation trigger hasn't committed yet (retry a few times with backoff before giving up) rather than treating "no profile yet" as "not logged in."
- **Logout** must actually invalidate the session server-side, not just clear local UI state.
- Fail open to a logged-out state (not an infinite loading spinner, not a crash) if the auth backend is unreachable or misconfigured — a broken auth connection should degrade to "please log in," never to a blank/frozen app.

## 3. Data model

Relational schema (Postgres-shaped; adapt types to your engine as needed). All tables use UUID primary keys unless noted. `profiles.id` **is** the auth system's own user id (1:1, not a separate foreign-keyed row) — everything else hangs off that id.

### `profiles`
One row per authenticated user, created only by the signup trigger described above.
- `id` (PK, = auth user id)
- `identifier` (text — email)
- `role` (`WORKER` | `EMPLOYER` | `ADMIN`)
- `created_at`

### `worker_profiles` — the "Skill Passport"
- `id` (PK)
- `user_id` (FK → profiles, **unique** — one passport per user)
- `full_name`, `trade_or_skill` (primary trade, kept for backward compat with a newer multi-skill model), `experience_years` (int)
- `cv_url`, `photo_url` (uploaded file URLs)
- `summary`, `bio` (text)
- `composite_score` (int, nullable — reserved for a future match-quality score)
- `country_of_origin`, `experience_in_country` (int)
- `status` (`Active` | `Suspended` — admin-controlled visibility toggle)
- `physical_attributes` (jsonb: height_cm, weight_kg, handedness, color_blindness — optional, trade-relevant)
- `media_links` (jsonb: intro_video_url, skill_video_url)
- `trade_specifics` (jsonb: free-form trade-tag map, legacy single-trade model)
- `history` (jsonb: ex_singapore bool, last_drawn_salary, total_experience)
- `is_verified` (bool)
- `skills` (jsonb array of `{ trade, tags, isPrimary }` — the current multi-skill model; a worker can hold several trades with per-trade tag sets, one marked primary)
- `created_at`, `updated_at` (auto-maintained)

### `worker_projects`, `worker_certifications`, `worker_references`
Three separate child tables, each FK'd to `worker_profiles.id` (not to the user directly) with cascade delete. Not a generic "subcollection" abstraction — three concrete, typed tables:
- **projects**: `project_name`, `role`, `year_start`, `year_end`, `description`
- **certifications**: `cert_name`, `expiry_date` (date), `document_url`
- **references**: `name`, `contact`, `relationship`

### `employer_profiles`
- `id` (PK), `user_id` (FK → profiles, unique)
- `company_name`, `description`, `website_url`, `phone`, `industry`, `location`, `company_size`, `year_founded` (int)
- `company_logo_url`
- `status` (`Active` | `Suspended`)
- `created_at`, `updated_at`

### `jobs`
- `id` (PK), `employer_id` (FK → profiles — the posting employer's user id)
- `employer_name` (denormalized for display without a join)
- `title`, `description`, `required_skills` (text array)
- `status` (`Active` | `On Hold` | `Closed`)
- `location`, `country`, `currency` (default `SGD`)
- `salary_min`, `salary_max` (int) — **constraint: `salary_max >= salary_min`, enforced at the database level**, not just in a form. A create/update that violates this must be rejected with a clear error, not silently clamped or allowed through.
- `created_at`
- **Mobile-first / blue-collar fields** (all optional, added to support shift-based hiring): `shift_schedule` (text, e.g. "12-hour rotating shifts, 6-day week, night allowance"), `perks` (text), `whatsapp_number` (text, E.164, for a "message to apply" contact path), `qualifying_questions` (text array — 2-3 short screening questions shown before/during Apply), `transport_provided` (bool) + `transport_details` (text), `accommodation_provided` (bool) + `accommodation_details` (text).

### `applications`
- `id` (PK), `job_id` (FK → jobs, cascade delete), `worker_id` (FK → profiles), `employer_id` (FK → profiles — denormalized from the job for direct querying)
- `status` (`Submitted` | `Viewed` | `Shortlisted` | `Rejected` | `Withdrawn`)
- `job_title`, `employer_name`, `location` (denormalized snapshot at time of application)
- `applied_at`
- **Constraint: `UNIQUE (job_id, worker_id)`** — enforced at the database level so "did they already apply" is never a client-side race condition. See §6 for the exact apply/withdraw/reapply semantics this enables.

### `blog_posts`
- `id`, `title`, `content`, `image_url`, `author`, `publish_date`

### `site_content`
Generic CMS key-value store for editable page copy: `id` (text PK — e.g. `homepage`, `aboutPage`, `contactPage`, `careersPage`, `legalPages`, `quickLinks`, `assets`), `data` (jsonb — the actual content, shape depends on the key), `updated_at`. One consistent shape per row (a plain object or array in `data`, no special-casing some keys as array-wrapped and others as bare objects — pick one convention and hold it everywhere).

### `newsletter_subscribers`
- `id`, `email` (unique), `created_at` — minimal capture table for the public newsletter signup; anyone can insert, only admins can read/list.

## 4. Authorization model (must hold regardless of client-side code)

Every table must be unreachable without an explicit rule — there should be no table anyone can read or write "by default." Rules, conceptually (implement via RLS or an equivalent server-enforced layer, not client-side checks alone):

| Table | Read | Write |
|---|---|---|
| `profiles` | self or admin | self may update own `identifier` only, **not** `role`; admin may update anything |
| `worker_profiles`, `employer_profiles` | public (needed for search/browsing) | owner (by `user_id`) or admin; delete = admin only |
| `worker_projects`/`certifications`/`references` | public | owner of the parent worker profile, or admin |
| `jobs` | public if `status = Active`, or the owning employer, or admin | owning employer or admin |
| `applications` | the applicant, the job's employer, or admin | insert: the applicant only (and only for their own worker id); update: applicant or employer (status changes) or admin; delete: admin only (see §6 — applications are never hard-deleted by normal users) |
| `blog_posts`, `site_content` | public | admin only |
| `newsletter_subscribers` | admin only | insert: anyone (public signup) |

An `is_admin()`-style check should be a single, reusable, server-side predicate (not re-implemented ad hoc per query) that looks up the requester's *own* `profiles.role` — never trust a role claim embedded in a client-supplied token/payload for this.

**One operation needs a fully privileged/service-level bypass of the above**: permanently deleting a user account (which must cascade-delete everything that user owns). This is dangerous enough that it should run behind a server-side function that (a) verifies the caller's own session token is valid, (b) independently re-checks that the caller is actually an admin by querying the database itself — never by trusting a role the client claims to have — and only then (c) performs the privileged delete. This is the *only* place a service-level credential should ever be used, and that credential must never be reachable from client code.

## 5. File storage

Buckets, one per asset category: worker photos, worker CVs, worker certification documents, employer logos, blog images, site/brand assets. Convention: every uploaded file lives at `{owner_user_id}/{filename}` within its bucket. Read is public (files need to be linkable/displayable without auth); write/delete is restricted to the owning user id (matched against the first path segment) or an admin. Every "save this record" flow that includes a file input must actually upload the file to storage and persist the returned permanent URL — never persist a browser-local/ephemeral object URL (`URL.createObjectURL(...)`-style references) into the database; that produces a URL that is only valid in the uploading browser's current tab and is dead on reload or for any other viewer.

## 6. Core business rules

**Applying to a job** is an upsert keyed on `(job_id, worker_id)`, not a plain insert guarded by a client-side "have I already applied" check (that's a race condition under double-clicks or multiple tabs — the database unique constraint from §3 is the real guard):
- No existing application → insert one with status `Submitted`.
- Existing application with status `Withdrawn` → reactivate it (status back to `Submitted`, timestamp refreshed) rather than inserting a duplicate row.
- Existing application with any other status → reject with "you've already applied," don't silently no-op or duplicate.

**Withdrawing an application** is a *soft* action: set status to `Withdrawn`. Never hard-delete an application record on a user-initiated withdraw — the row (and its history/status) should survive, both because the unique-constraint reapply logic above depends on it existing, and because destroying application history is a bigger action than a "withdraw" button should silently perform. A withdraw action must require explicit confirmation before firing — no destructive action fires on a single accidental click with no confirmation step.

**Salary range** (`salary_min`/`salary_max`) must be validated whenever a job is created or edited, both at the database constraint level and surfaced as a clear user-facing error at the application layer — don't let one layer silently paper over what the other would reject.

**Shortlist / Reject / status-change actions** by an employer must actually persist to the `applications` row (`updateApplicationStatus`-style write) — not just update local UI state optimistically and never write through. A rejected applicant must stay rejected after a page refresh; the UI must never claim an action succeeded ("this will notify the applicant") if no corresponding write actually happened.

**Worker search** (used both by the standalone employer search panel and, implicitly, by public job-seeking flows) must query real, persisted worker data with server-side filtering and pagination (skill / experience-years-minimum / country, at minimum) — not fetch the entire worker table and filter/paginate client-side, and **must never fabricate/hallucinate candidate profiles** and present them as if they were real, persisted workers. If an AI-assist feature is ever added on top of search, it must be clearly, visibly distinguishable from real database results — a user must never be unable to tell whether a "candidate" shown to them actually exists.

**Bulk job import** (CSV or similar) must use a real, spec-compliant parser (handling quoted fields, embedded commas/newlines) — not naive line/comma splitting, which silently corrupts any row containing a comma inside a text field. Malformed rows should produce a clear per-row error, not a silently-misaligned import.

**Admin "delete user"** should be understood as full account removal (auth credential + everything that FKs to it, via cascade), not merely blanking a profile row while leaving a dangling, unauthenticatable-but-still-listed record — and, per §4, must go through the privileged server-side path with its own admin re-verification, and must require confirmation before firing.

## 7. Server-side / privileged operations (things that must never run in client-visible code)

Any operation that needs a secret (a third-party API key, a service-level database credential) must be proxied through a server-side function, never called directly from the client bundle — a secret shipped in client-side code is not a secret. Concretely, two such operations exist in this product:

1. **AI-assisted job description generation.** Given a job title (and optionally a company name), call an LLM to produce a professional job description plus a list of 5-7 required skills, returned as structured data (not prose you then regex/parse). Validate/sanitize the input (title required, reasonable length caps) before forwarding it to the model. This is a legitimate assist feature for a human filling out a job form — it is not, and must not become, a way to fabricate entire fake job or candidate datasets that get presented as real records (see §6's search-fabrication rule — the same principle applies to any "generate sample data" feature: label it obviously as generated, or don't ship it against real-looking UI at all).
2. **Privileged account deletion**, as described in §4/§6.

Every other read/write in the product should go through the normal client-authenticated, RLS/authorization-enforced path from §4 — don't build a server-side proxy "for consistency" where the normal authenticated path already works; reserve the privileged layer for the cases that genuinely need a secret or a bypass.

## 8. Functional surface by role

### Worker
- Register/login (role = WORKER).
- Create/edit Skill Passport: primary + multiple trades with tags, experience, country/origin-experience, bio/summary, physical attributes, media links, photo, CV upload.
- Add/edit/remove projects, certifications (with expiry tracking — an expired or soon-to-expire certification should be visibly flagged, and a certification with an unparseable/invalid expiry date must be flagged as such, never silently treated as "verified/valid"), and references — each as independent, ordered lists, not a single blob.
- Browse/search active job postings (public listing, filterable).
- View full job detail, including the mobile-first fields (shift schedule, perks, transport/accommodation, WhatsApp contact, screening questions) when present.
- Apply to a job (see §6 semantics); see application status per job; withdraw; reapply after a withdrawal.
- View "My Applications" list with current status per application.
- Have a public-facing profile page (shareable link) showing their passport — should degrade gracefully (partial content, not a full-page crash) if one sub-resource (e.g. certifications) fails to load while the rest succeeds.

### Employer
- Register/login (role = EMPLOYER).
- Create/edit company profile (with logo upload).
- Create/edit/close job postings, including the mobile-first fields; AI-assisted description generation available but optional; salary-range validation enforced.
- View applicants per job (with each applicant's current application status, not just their profile); move an applicant through the status pipeline (Viewed → Shortlisted / Rejected), each transition persisted.
- Search the worker pool directly (independent of any specific job posting) with real filters and pagination.
- Bulk-import job postings via CSV with real parsing and per-row validation feedback.
- View a public company profile page listing their active postings.

### Admin
- Login is the same email/password flow as everyone else, gated purely on `profiles.role = ADMIN` — no separate credential system.
- Manage users: paginated, searchable list of workers and employers; view/edit any profile; suspend/reactivate (status toggle); permanently delete an account (privileged path, confirmation required, per §4/§6).
- Manage blog posts: full CRUD, including image upload that actually persists (see §5).
- Manage site content: edit the CMS-controlled copy blocks (homepage sections, about/contact/careers page text, legal pages, footer quick links) and site branding assets (logo, hero background) — and this content must actually be consumed by the public-facing pages it's meant to control. A CMS field that an admin can edit but that has zero visible effect anywhere on the live site is a bug, not a feature with limited scope.
- Every admin list/table needs real loading and error states — a table that starts silently empty on a fetch failure, with no indication anything went wrong, is not acceptable.

### Public / unauthenticated visitor
- Browse job listings, individual job detail pages, company profile pages, public worker profile pages, blog listing, and static informational pages (about/contact/careers/legal), all sourced from real persisted/CMS data, not hardcoded copy that happens to look CMS-editable in the admin panel but isn't actually wired to the page.
- Sign up for the newsletter (must actually persist the email somewhere, not just show a success message).
- Register or log in.

## 9. Explicit non-goals / things not to reintroduce

These were deliberately removed from an earlier version of this product during a security/correctness pass — treat their absence as a requirement, not an oversight:
- No hardcoded or "demo" login credentials of any kind, for any role, ever — including for testing/QA convenience. Test accounts, if needed, should be real accounts created through the real signup path (or seeded directly in the database by someone with legitimate access), never a special-cased credential baked into application code.
- No client-side flag (localStorage/sessionStorage/cookie a user could set themselves) that grants elevated access on its own — every privilege check must be re-verified server-side.
- No feature that generates fictional records (candidates, jobs, applicants) and displays them indistinguishably from real, persisted data.
- No action that claims to have "notified," "saved," "deleted," or otherwise changed durable state without an actual corresponding write — UI optimism is fine, but it must be backed by (or promptly reconciled against) a real persisted result.
- No destructive action (delete, permanent withdraw/removal) without an explicit confirmation step.
- Phone-number authentication is **not implemented** in the current build (only email/password) — don't present UI that implies it works.

## 10. What this document intentionally omits

Visual design, layout, color system, typography, iconography, animation/motion, responsive breakpoints, and component styling are out of scope here by design — those are governed separately (in this project's case, by a dedicated frontend design-taste pass applied on top of this functional layer). A regeneration effort using only this document should produce a fully working, secure, data-correct product with placeholder/plain styling; a separate design pass is expected before it's presentable.
