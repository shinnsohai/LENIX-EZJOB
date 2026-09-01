---
name: EZJOB by LENIX
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  brand-magenta: '#d946ef'
  brand-orange: '#f97316'
  brand-blue: '#3b82f6'
  surface-dark: '#020617'
  surface-card-dark: '#0f172a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
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
This design system evolves the "Industrial Integrity" ethos into a high-performance tech-driven recruitment platform. It retains the structural reliability of the industrial sector while injecting the vibrant, future-forward energy of the LENIX brand. The aesthetic is a fusion of **Corporate Modern** and **Digital Precision**, emphasizing high-speed matching and professional authority.

The core brand pillars are:
- **Technical Excellence:** A digital-first approach to traditional trades, using sharp accents to highlight AI-driven matching.
- **Dynamic Growth:** Utilizing vibrant brand gradients to symbolize career progression and energy.
- **Structural Trust:** Deep slate foundations ensure the platform feels as solid as the infrastructure projects its users build.
- **High-Visibility:** Drawing inspiration from safety equipment and digital interfaces to ensure clarity in any environment.

## Colors
The color strategy employs a "Dual-Foundation" model to support both Light and Dark environments.

**Light Mode:**
- **Primary:** Deep Slate (#0f172a) is used for primary surfaces, headers, and navigation to maintain industrial grounding.
- **Background:** A crisp white (#ffffff) or ultra-light slate (#f8fafc) provides the workspace canvas.
- **Accents:** The LENIX palette (Cyan, Blue, Magenta, Orange) is used for high-visibility interactive elements. Cyan (#06b6d4) acts as the primary action color.

**Dark Mode:**
- **Primary Surface:** Deep Black (#020617) based on the Lenix brand background.
- **Container Surface:** Dark Slate (#0f172a) for cards and nested sections.
- **Text:** High-contrast off-whites ensure legibility against the deep backgrounds.

**Vibrant Accents:**
Magenta (#d946ef) is reserved for "New" or "Hot" job alerts. Orange (#f97316) represents "Urgent" or "Action Required" statuses. Blue (#3b82f6) is used for informational links and secondary progress tracking.

## Typography
The system relies on **Inter** for its versatile, neutral, and highly legible characteristics across all interface scales. Bold and Extra Bold weights are used to establish a clear hierarchy, mirroring the strength of industrial signage.

**JetBrains Mono** is utilized as a functional accent. It is applied to job IDs, salary ranges, certification codes, and data table headers. This reinforces the "specification" nature of job requirements and adds a layer of technical sophistication. 

Letter spacing is tightened for large headlines to maximize impact, while body text maintains standard tracking for optimal reading flow in long job descriptions.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The interface is organized around a 12-column grid for desktop with a maximum container width of 1440px to prevent excessive line lengths.

- **Desktop:** 12 columns / 24px gutters / 32px margins. Ideal for complex ATS dashboards and multi-pane views.
- **Tablet:** 8 columns / 20px gutters / 24px margins. Sidebar navigation collapses into a drawer.
- **Mobile:** 4 columns / 16px gutters / 16px margins. Content is primarily single-column stacked, with horizontal carousels used for skill chips.

Spacing units are strictly based on a 4px baseline, ensuring all elements align to a predictable rhythmic grid.

## Elevation & Depth
Depth is established through **Tonal Layers** in light mode and **Vibrant Glows** in dark mode.

- **Surface Tiers:** In light mode, surfaces move from White (Base) to Slate-50 (Container). In dark mode, surfaces move from Deep Black (Base) to Deep Slate (Container).
- **Interactive Depth:** Hover states on primary cards utilize a subtle, brand-tinted shadow (e.g., a faint Cyan glow) rather than a neutral gray shadow to inject the LENIX identity.
- **Borders:** Low-contrast 1px outlines are used to define boundaries on static elements. Interactive elements (like active input fields) use a 2px solid brand-cyan border to draw the eye.

## Shapes
The design system utilizes **Soft (0.25rem)** roundedness. This "engineering-grade" radius is precise and modern, avoiding the overly-playful feel of fully rounded corners while remaining more accessible than sharp 90-degree angles.

- **Primary Components:** 4px (0.25rem) radius for buttons, inputs, and cards.
- **Data Tags:** 2px radius to give them a "stamped" or "machined" look.
- **Selection Indicators:** Vertical bars on the left side of active list items remain sharp (0px) to indicate precision and alignment.

## Components
- **Buttons:** Primary buttons use a Cyan-to-Blue gradient in dark mode, or Solid Deep Slate with Cyan accents in light mode. Labels are uppercase JetBrains Mono for a technical feel.
- **Progress Bars:** Use a multi-stop gradient (Cyan to Magenta) to represent completion, moving from "Starting" (Blue/Cyan) to "Complete" (Magenta/Orange).
- **Status Chips:** High-contrast capsules. "Applied" (Blue), "Interviewing" (Magenta), "Hired" (Cyan), "Rejected" (Slate).
- **Job Cards:** Feature a 4px vertical brand-accent border on the left to indicate category (e.g., Orange for "Immediate Start").
- **Input Fields:** Professional Slate borders. On focus, the label remains fixed above the field in a smaller, JetBrains Mono font-weight.
- **Navigation:** The sidebar in light mode is Deep Slate (#0f172a) with White text, creating a strong anchor for the application. Active links are highlighted with a Cyan left-border.