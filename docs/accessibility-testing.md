# Accessibility testing

Fremont Derby targets WCAG 2.2 AA. Automated rendered checks are a regression guardrail, not complete accessibility proof.

## Rendered Pa11y gate

Run the same deterministic gate used by CI:

```bash
npm run a11y
```

The command starts a local Worker and scans a deliberately small canonical matrix with Pa11y at `WCAG2AA` and a zero-error threshold. It runs both `htmlcs` and `axe` for each state:

- Home at a representative desktop viewport;
- Home at 320 CSS px;
- Home at 320 CSS px with the shared mobile menu open;
- Standings at 320 CSS px during its truthful loading/recovery path.

Failure output names the route/state, viewport, and runner before Pa11y reports the violated rule. Do not increase the threshold or add blanket ignores to make CI green. A suppression must be narrowly scoped to a documented false positive; a real defect gets fixed or tracked with explicit ownership.

The suite uses only local rendering and must not require production credentials or mutate production data.

## Manual release review remains required

Pa11y cannot prove the complete interaction experience. For every changed user-facing workflow, manually verify at minimum:

- text contrast and meaningful non-text/control contrast;
- keyboard operation and logical focus order;
- visible, unobscured focus in resting and open/active overlay states;
- accessible names, roles, selected/current state, and status/error announcements;
- zoom and text resizing;
- 320 CSS px reflow without two-dimensional page scrolling except genuinely two-dimensional content;
- primary touch targets at the repository's 44px minimum convention;
- reduced-motion behavior where motion is present.

Menus, drawers, dialogs, sticky/fixed headers, message previews, and bottom navigation must be reviewed while open/active, not only at rest. Automated success is evidence, not a waiver of this manual review.
