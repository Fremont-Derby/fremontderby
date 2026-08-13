---
name: mobile-ux-review
description: Review a Fremont Derby player/captain workflow for fast mobile task completion, discoverability, accessibility, consistency, legibility, and unnecessary technical friction.
---

Use for common player/captain browser flows.

Review the workflow as a phone user trying to complete one real task quickly.

Treat WCAG 2.2 AA as the product accessibility target. Use Pa11y WCAG2AA as an automated guardrail when practical, not as complete accessibility proof.

Check:
1. Can the user find the task from normal navigation without knowing a direct URL?
2. Are the primary action and current state visible without excessive scrolling?
3. Are team/player/date/match choices human-readable rather than technical IDs or tokens?
4. Are touch targets, forms, toggles, errors, confirmations, and recovery clear?
5. Does authentication come from the existing session without manual token entry?
6. Does the UI preserve server-side authorization rather than bypassing it?
7. Can the user understand what happens next and whether the action succeeded?
8. Are team/individual views and other common comparisons one-tap when appropriate?
9. Does every loading, signed-out, expired-session, empty, unavailable, and failure state explain what happened and provide one obvious next action?
10. Does initial UI avoid claiming success/readiness before real data has resolved, and are important status changes exposed through accessible live-region semantics?
11. On auth-gated management pages, are mutation controls/private panels withheld until session state resolves, so signed-out or slow-network users never see authenticated-looking controls that cannot work?
12. When a form or control cannot be used, is it hidden or clearly disabled with the reason nearby rather than left looking broken?
13. Do dense lists/tables fit the phone without horizontal page/panel scrolling, while keeping each row's person/team, state, and primary action understandable together?
14. If a desktop table is retained semantically, does the narrow-phone presentation wrap/reflow into usable rows/cards or a compact grid rather than requiring sideways hunting?
15. Does normal text meet at least 4.5:1 contrast and large text at least 3:1, including menu items, helper text, placeholders that remain necessary, tab labels, and secondary actions?
16. Do meaningful control/state boundaries and focus indicators reach at least 3:1 against adjacent colors, and is focus visible and not obscured by sticky/fixed UI?
17. Are active navigation items and available actions clearly distinguishable from disabled/unavailable content without relying on color alone?
18. At 320 CSS px, does the page reflow without two-dimensional page scrolling except for content that genuinely requires a two-dimensional layout?
19. When menus, drawers, dialogs, sticky headers, or bottom navigation are open/active, does every visible label remain legible and does the overlay avoid conflicting navigation emphasis or hiding keyboard focus?
20. Do equivalent controls use the shared design-system treatment consistently across routes instead of inventing page-local button, tab, input, card, loading, error, or navigation styles?
21. If a shared token/component changed, were representative sibling routes checked so the local fix did not create a contrast or legibility regression elsewhere?
22. If Pa11y is available, does the changed user-facing route pass WCAG2AA with zero accepted errors at representative mobile and desktop viewports, using both `htmlcs` and `axe` when supported?
23. Are Pa11y findings fixed rather than ignored/thresholded away, unless a specific false positive is documented or an unresolved defect is explicitly tracked?
24. Has manual review still covered keyboard operation, focus order/visibility, accessible names/roles, selected/current state, zoom/text resize, and screen-reader/status semantics that automated checks cannot prove?

State and recovery are part of the workflow, not decorative edge cases. Prefer one prominent recovery action such as Sign in, Try again, Join/apply, View tonight, or Open Teams over explanatory prose with no actionable next step.

For auth-gated management surfaces, the first render should be truthful even on a slow network: show a loading/signed-out state before revealing forms, mutation controls, private panels, counts, or placeholders that imply an authenticated session.

For dense management data, preserving a semantic table does not require preserving a desktop table layout. Prefer responsive wrapping/reflow that keeps row identity and actions together over `min-width` plus `overflow-x:auto` on phone widths.

Consistency is part of usability. Prefer shared design-system tokens/components and one predictable interaction language across Home, Teams, Schedule, Standings, Score, Messages, Profile, and admin surfaces. Pool-inspired texture and decoration come after legibility.

Create focused issues for discovered friction. Prefer fixing the real product instead of a demo-only surface unless the issue explicitly targets the demo.
