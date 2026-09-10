# EZJOB by LENIX — Design System

Distilled from `tailwind.config.js` and `index.css` (source of truth — if this
file and the code ever disagree, the code wins and this file is stale).
Written for mechanical checking: every rule below is something a critic can
verify by inspecting a class name or a computed style, not a judgment call.

## Color tokens

**Brand accents** (the only four accent hues in the system):
- `brand-cyan` `#06b6d4`
- `brand-blue` `#3b82f6`
- `brand-magenta` `#d946ef`
- `brand-orange` `#f97316`

**Gradient text utilities** (only these three combinations are approved — no ad hoc gradients):
- `.text-gradient-lenix` — cyan → blue → magenta (135deg), for the brand wordmark / hero emphasis only
- `.text-gradient-cyan-blue` — cyan → blue (90deg), the default single-accent headline treatment
- `.text-gradient-magenta-orange` — magenta → orange (90deg), secondary/alternate emphasis only

**Surface tokens** (Material-3-style, light mode): `surface #fcf8fa`, `surface-container-lowest #ffffff` through `surface-container-highest #e4e2e4`, `on-surface #1b1b1d`, `on-surface-variant #45464d`.

**Dark mode surfaces**: `surface-dark #020617` (page background), `surface-card-dark #0f172a` (cards), `surface-container-dark #1e293b`. In practice the codebase mostly uses plain Tailwind `slate-950`/`slate-900`/`slate-800` for dark surfaces rather than these named tokens — both are in use; do not introduce a third dark-surface value.

**Glass utilities**: `.lenix-glass` (dark, `rgba(15,23,42,.85)` + 16px blur), `.lenix-glass-light` (light, `rgba(255,255,255,.85)` + 16px blur). Use for elevated panels over imagery/gradients only, not for plain content cards.

**Glow utilities**: `.lenix-glow-cyan`, `.lenix-glow-magenta` — soft 25px shadow glows, used sparingly on primary CTAs/hero elements, never on body content.

**Rule — Color Consistency Lock**: one locked accent per page for all functional UI (buttons, links, active states, focus rings). The tri-color ambient background gradients (cyan/blue/magenta) are decorative wallpaper only and may appear regardless of the page's locked functional accent.

## Typography

- **Sans / display**: Inter (`font-sans`, `font-display`)
- **Mono / label**: JetBrains Mono (`font-mono`, `font-label`) — used for eyebrows, badges, technical/data labels, and form labels throughout the app (this is a distinctive, load-bearing convention, not incidental)
- Serif: not used anywhere in the system. Introducing one is a system violation.

## Dark mode

- Strategy: Tailwind `dark:` variant, driven by a `.dark` class on `<html>` (see `contexts/ThemeContext.tsx`), not `prefers-color-scheme` media queries directly in components.
- **Every** component must carry explicit `dark:` classes for any non-inherited color/background/border it sets. A color class with no `dark:` counterpart sitting on the dark page shell is a system violation (this was the exact bug fixed in the worker-dashboard wizard pass — see git history).
- No pure `#000000` or pure `#ffffff` as a dark-mode background; use the slate-950/900/800 or `surface-dark`/`surface-card-dark` scale.

## Motion

- One approved CSS keyframe: `.animate-fade-in-up` (`lenix-fade-in-up`, 0.5s, `cubic-bezier(0.16, 1, 0.3, 1)`, translateY 12px → 0). Used sparingly for mount-in on page headers and grid cells.
- Must be wrapped in `@media (prefers-reduced-motion: no-preference)` — it already is at the CSS level; components should not re-implement their own reduced-motion gate for this specific utility.
- No JS animation library in the dependency tree (no Motion/Framer Motion, no GSAP) — animation is CSS-only or native `IntersectionObserver` (see `HomePage.tsx`'s `useInView`/`Reveal` pattern). Adding an animation library is a system violation unless explicitly approved.

## Layout primitives

- Corner radius: `rounded-xl`/`rounded-2xl` for cards and panels, `rounded-full` for pills/badges/interactive circular controls (e.g. the wizard stepper). One radius scale per surface — don't mix sharp and pill radii on sibling elements without a documented reason.
- Page container: `max-w-7xl mx-auto` (marketing/content pages) or `max-w-3xl mx-auto` (single-column forms/wizards, e.g. the worker profile editor).
- Icons: `lucide-react` exclusively. No hand-rolled SVG icon paths, no second icon library.

## Brand lockup

- The three-logo cluster (Clarity E&C × LENIX × EZJOB) is a shared component, `components/BrandLogoCluster.tsx` — do not re-implement this markup inline in a page; import and use the component.
- EZJOB's own product logo comes from `siteAssets.logoUrl` (admin-CMS-overridable) falling back to the bundled `ezjob-logo-{light,dark}.png` — never hardcode a different EZJOB mark.

## Scope note for this design system

This system governs **marketing/content/auth surfaces** (HomePage, About, Contact, Careers, Blog, legal pages, Auth). It intentionally does not prescribe dense-product-UI patterns (data tables, multi-step wizards, admin CRUD panels) — those already have their own established conventions in `pages/AdminDashboard.tsx`, `pages/WorkerDashboard.tsx`'s wizard, and `pages/EmployerDashboard.tsx`, and should be judged for *internal* consistency with those existing patterns rather than against a marketing-site craft bar.
