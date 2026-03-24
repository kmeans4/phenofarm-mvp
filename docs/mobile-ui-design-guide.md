# PhenoFarm — Mobile UI Design Guide (Grower Portal)

_Last updated: 2026-03-23_

## 1) Purpose
This guide defines how Grower Portal pages should look and behave on mobile (320px–430px wide), with practical rules for layout, touch interaction, forms, data tables, and QA.

---

## 2) Core mobile principles
1. **One clear primary action per screen** (e.g., Save, Add Product, Create Batch).
2. **No horizontal scrolling** for primary content.
3. **Tap-first UX**: all critical controls must be thumb-friendly.
4. **Readable at a glance**: hierarchy, spacing, and contrast over density.
5. **Progressive disclosure**: hide secondary details behind accordions or “More”.

---

## 3) Breakpoints & layout
- **Mobile baseline:** 320–430px
- **Tablet:** 431–1024px
- **Desktop:** 1025px+

### Container rules
- Use full-width mobile content with side padding `px-4` (16px).
- Max content width should not force zoom or side-scroll.
- Avoid fixed-width elements inside mobile cards/forms.

### Spacing scale
- Tight: 8px
- Default gap: 12px
- Section spacing: 16px
- Major block spacing: 24px

### Vertical rhythm
- Page title block: 16px bottom margin
- Card block: 16px vertical spacing
- Form field stack: 12px spacing

---

## 4) Typography
- Body default: `text-sm` (14px)
- Dense metadata: `text-xs` (12px)
- Page title mobile: `text-2xl` max (avoid oversized headings)
- Keep line-length short; wrap long names (`break-words`) where needed.

---

## 5) Touch targets & controls
- Minimum touch target: **44x44px**
- Buttons in rows should stack on mobile if cramped.
- Keep dangerous actions (delete/disable) visually distinct and separated.
- For icon-only buttons, include accessible labels and clear hover/focus states.

---

## 6) Navigation patterns
- Mobile header should include:
  - Product/app identity
  - Search (if high value)
  - Menu/hamburger access
- Avoid multi-row top bars where possible.
- Keep bottom-sheet or slide-over nav simple and vertically scannable.

---

## 7) Forms (add/edit pages)
### Inputs
- Full-width fields on mobile.
- Label above field, never placeholder-only labeling.
- Keep helper/error text directly beneath each field.

### Form actions
- Primary save button should remain easy to reach.
- For long forms, include sticky action bar or repeated action buttons.
- Avoid crowded inline dual-column field layouts on mobile.

### Validation
- Validate early for required fields.
- Use explicit error messages tied to exact field.
- Preserve in-progress values when validation fails.

---

## 8) Data display (lists, tables, cards)
### Lists/Tables
- On mobile, convert dense tables to card/list rows.
- Keep only top-priority fields visible first (name, status, price, inventory).
- Move secondary metadata below in smaller text.

### Status + metrics
- Use chips/badges for quick status scanning.
- Color must not be the only signal (include text labels).

### Units and quantities
- Always render quantity + unit clearly.
- Use correct pluralization rules.
- Use “Out of Stock” when quantity is 0.

---

## 9) Responsiveness rules for Grower pages
Apply these to each grower page and add/edit flow:

- `/grower`
- `/grower/dashboard`
- `/grower/products`, `/grower/products/add`, `/grower/products/[id]/edit`
- `/grower/strains`, `/grower/strains/add`, `/grower/strains/[id]/edit`
- `/grower/batches`, `/grower/batches/add`, `/grower/batches/[id]/edit`
- `/grower/orders`, `/grower/orders/add`, `/grower/orders/[id]`, `/grower/orders/[id]/edit`, `/grower/orders/history`
- `/grower/customers`, `/grower/customers/add`, `/grower/customers/[id]/edit`
- `/grower/inventory`, `/grower/inventory/add`
- `/grower/marketplace`
- `/grower/reports`
- `/grower/settings`
- `/grower/pricing`
- `/grower/metrc-sync`

Per page check:
1. No horizontal overflow
2. Header fits and wraps cleanly
3. Primary action visible and tappable
4. Forms are single-column on mobile
5. Action buttons don’t collide/wrap awkwardly
6. Status/metric text remains readable at 320px

---

## 10) Accessibility baseline
- Color contrast meets WCAG AA.
- Keyboard focus visible for all actionable controls.
- Form inputs have labels and error associations.
- Use semantic headings and landmarks.
- Avoid relying on color alone for state.

---

## 11) Performance and perceived speed
- Prioritize above-the-fold content first.
- Avoid heavy animations on initial load.
- Use skeletons/placeholders only where they reduce perceived wait.
- Defer non-critical charts and heavy data blocks.

---

## 12) QA checklist (mobile)
Test at **320x568**, **390x844**, and **430x932**:

- [ ] No side-scroll at any viewport
- [ ] All primary buttons are fully visible and clickable
- [ ] Form submission works without zooming
- [ ] Dropdowns/selects are fully interactive
- [ ] Error/success messaging is visible and understandable
- [ ] Text does not clip in badges/chips/buttons
- [ ] Card/list spacing is consistent
- [ ] Sticky/fixed headers do not hide page content

---

## 13) Implementation conventions (Tailwind)
Recommended defaults:
- Containers: `px-4 sm:px-6`
- Mobile headings: `text-2xl sm:text-3xl`
- Flexible headers: `flex-col gap-2 sm:flex-row sm:justify-between`
- Wrapping long text: `break-words`
- Form stacks: `space-y-3` or `space-y-4`
- Action groups: `flex-col sm:flex-row gap-2`

---

## 14) Definition of done for mobile UI improvements
A page-level mobile fix is done when:
1. Visual issue is resolved at 320–430px.
2. Interaction works reliably (tap/submit/select).
3. No regressions in tablet/desktop layout.
4. Lint/type checks pass.
5. Change is committed with a clear message.
