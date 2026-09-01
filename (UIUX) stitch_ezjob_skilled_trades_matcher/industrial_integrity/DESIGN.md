---
name: Industrial Integrity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system is engineered for the skilled trades sector, emphasizing reliability, physical safety, and operational efficiency. It utilizes a **Modern Corporate** style infused with **Industrial Minimalism**—prioritizing high-contrast legibility and structural stability. 

The aesthetic is characterized by:
- **Professionalism:** Using a cold, slate-based palette to evoke a sense of steel and architecture.
- **Safety & Urgency:** Strategic use of emerald and amber to mirror safety signaling found on job sites.
- **Efficiency:** A high-density layout that respects the user's time, providing clear data visualization for rapid decision-making in the recruitment process.
- **Trust:** A "built-to-last" feel through deliberate alignment and solid UI elements.

## Colors
The palette is rooted in high-contrast utility. **Deep Slate (#0f172a)** provides the structural foundation, used for primary backgrounds or heavy text to ensure maximum grounding. **Clean Slate (#f8fafc)** acts as the canvas, providing a bright, sterile environment that highlights information without glare.

**Vibrant Emerald (#059669)** is the "Action" color, reserved for primary CTA buttons, profile completion, and "Hired" statuses. **Amber (#f59e0b)** serves as the "Attention" color, specifically for safety certifications, warnings, and pending alerts. All color pairings must pass WCAG AA standards for contrast to ensure accessibility for users in high-glare outdoor environments.

## Typography
This design system utilizes **Inter** for all primary interface elements due to its exceptional tall x-height and legibility in data-heavy contexts. Headings are rendered with "Extra Bold" weights to mimic industrial signage and convey authority. 

**JetBrains Mono** is introduced for secondary labels, safety IDs, and technical specifications (e.g., salary ranges, job codes). This monospaced touch adds a technical, precise "spec-sheet" feel to the industrial narrative. Use tight letter-spacing on large headings to maintain a compact, impactful look.

## Layout & Spacing
The layout follows a **Strict Fluid Grid** model based on a 4px baseline. On Desktop, a 12-column grid is used with a generous 24px gutter to prevent data-heavy tables from feeling cluttered.

- **Mobile:** 4-column grid with 16px margins. Vertical stack is mandatory for Kanban cards.
- **Tablet:** 8-column grid. ATS boards may use horizontal scrolling for columns.
- **Desktop:** 12-column grid. Max-width container set to 1440px to ensure line lengths for job descriptions remain readable.

Spacing should be used to create clear "zones." For example, 40px (lg) spacing should separate major sections like "Applicant Details" and "Skills Analysis," while 8px (xs) spacing is used for internal card elements.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows, maintaining a "flat-built" industrial aesthetic.

1.  **Level 0 (Surface):** The main background (#f8fafc).
2.  **Level 1 (Cards):** White background with a 1px solid border (#e2e8f0).
3.  **Level 2 (Interactive):** Elements like active Kanban cards use a very soft, diffused shadow (0px 4px 12px rgba(15, 23, 42, 0.05)) to indicate they can be dragged.
4.  **Level 3 (Modals):** High-contrast overlay (Deep Slate at 40% opacity) with a solid white container to focus attention on critical hiring decisions.

## Shapes
This design system uses a **Soft (0.25rem)** roundedness level. This provides a balance between the "sharp" precision of industrial tools and the "friendly" accessibility of a modern job board. 

- **Standard Buttons & Inputs:** 4px (0.25rem) corner radius.
- **Status Badges & Chips:** 2px corner radius for a more rigid, "stamped" appearance.
- **Gauges & Charts:** Data visualizations should use geometric, un-rounded paths to emphasize precision in AI matching.

## Components
- **Buttons:** Primary buttons are Solid Emerald with White text. Secondary buttons are Deep Slate with White text. Tertiary/Utility buttons use a 1px Slate border. All have a "pressed" state that shifts 10% darker.
- **Kanban Boards:** Columns utilize the Clean Slate background with a dashed top-border. Cards within the board must feature a "Skill Match" indicator using the Emerald color for the percentage.
- **Data Tables:** High-density, no vertical borders. Header rows are Deep Slate with White monospaced text. Alternating row stripes (zebra striping) use a 2% Slate tint.
- **Completeness Gauges:** Linear or circular progress bars using the Emerald-to-Slate track. No gradients; use solid color blocks to represent progress increments.
- **Radar Charts:** Used for AI matching. The "Candidate Area" should be a semi-transparent Emerald (#059669 at 20%) with a 2px Emerald stroke. The "Job Requirement" baseline should be a dashed Slate line.
- **Input Fields:** Thick 1px borders (#cbd5e1). On focus, the border transitions to 2px Solid Emerald. Labels must always be visible (no floating labels) to ensure clarity for all users.