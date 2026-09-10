# Design bar: vercel.com (2026-09)

Extracted by inspecting computed styles + visual scan of the live homepage,
not by description. Every line here is something a critic can verify by
looking at a screenshot or checking a computed value — no adjectives.

1. **Headline weight is regular, not bold.** H1 measured at `font-weight: 400`, `font-size: 64px`, `letter-spacing: -3.84px` (~-6% of size, tight negative tracking), `line-height: 64px` (exactly 1.0 — solid leading, zero extra line gap). A bold, loosely-tracked, or loose-leaded headline fails this.
2. **Two type sizes, ~3.2x apart, nothing between.** Headline 64px vs. secondary/body text 20px (`line-height: 32px`, i.e. 1.6 ratio). No intermediate "subheading" size bridging the two.
3. **Off-white/near-black, never pure.** Body background measured `rgb(250,250,250)` (#fafafa), text `rgb(23,23,23)` (#171717). Pure `#ffffff`/`#000000` anywhere is a fail.
4. **One accent, used only on the mark and the primary CTA.** Everything else — feature labels, body copy, secondary links — is pure grayscale. A second color anywhere else in the flow fails this.
5. **Feature sections are plain text lists, not cards.** A muted, small, uppercase-ish gray eyebrow label ("Features") sits above a stack of plain link-styled text rows — no icon, no border, no background fill, no card shadow.
6. **Extreme vertical isolation per section.** At a ~785px-tall viewport, one feature block fully occupies the frame with no sibling section visible above or below it. Sections do not compete for attention within one scroll position.
7. **Nav is minimal at the top level.** Two elements only on the marketing homepage nav bar — the wordmark/logo and a single menu affordance. No visible multi-item horizontal link list competing with the hero.

## What this bar does NOT cover
Per `design-system.md`'s scope note, this bar applies to the 12 marketing/content/public pieces only. The 5 dense-product-UI pieces (dashboards, wizards, admin CRUD) are judged by Brief + System critics against their own existing internal conventions, not against this bar.
