---
applyTo: "src/*Page.js,src/appShell.js,src/publicPages.js"
---

Read `AGENTS.md`, the current issue, and the real user flow before changing UI.

Treat **legibility, accessibility, and cross-route consistency as release gates**, not decorative polish.

- Prefer mobile-first, touch-friendly, low-scroll workflows.
- Normal users should choose people, teams, dates, rounds, and matchups—not paste UUIDs, access tokens, or service keys.
- Preserve browser session authentication; do not solve UX problems by weakening server authorization.
- Make errors visible, plain-language, dismissible when appropriate, and accessible to assistive technology.
- Treat loading, signed-out, expired-session, empty/no-data, unavailable, and failure states as first-class interaction states: explain what happened and provide one context-appropriate next action.
- Do not show placeholder zeroes or success/readiness language before real data resolves.
- On auth-gated management pages, do not paint usable-looking mutation controls, private management panels, or authenticated placeholder content before session/auth state resolves. Show one honest loading or signed-out surface first, then reveal authorized controls only after a usable session is confirmed.
- Hide unusable forms/controls or clearly disable them with the reason nearby; do not leave inert controls that look actionable.
- Important state/status changes should use accessible live-region semantics where appropriate, and meaning must never depend on color alone.
- Normal text must meet at least **4.5:1** contrast; large text at least **3:1**. Meaningful control/state boundaries and focus indicators must meet at least **3:1** against adjacent colors.
- Available actions and current navigation must never be styled so faintly that they resemble disabled content. Selected/current/error/success state must remain understandable without color alone.
- Recovery actions should remain keyboard reachable, visibly focused, at least 44px where they are primary touch controls, and easy to reach on narrow phones.
- Verify changed normal user-facing surfaces at **320 CSS px** without page-level two-dimensional scrolling, except for content that genuinely requires a two-dimensional layout.
- Do not solve dense phone layouts by forcing wide tables into horizontal scrolling. Preserve semantic relationships, but adapt tables into wrapping rows/cards or compact responsive grids so names, state, and primary actions remain visible without sideways hunting.
- When a mobile table carries row actions, keep the row identity and action together on screen; do not require users to remember a player/team from an off-screen column while scrolling sideways to act.
- Review menus, drawers, dialogs, sticky/fixed headers, and bottom navigation in their **open/active states**, not only at rest. Opening one layer must not create unreadable text, hide keyboard focus, or leave competing navigation visually dominant/interactable.
- Prefer shared design-system tokens/components for typography, surfaces, spacing, buttons, links, tabs, inputs, cards, loading/disabled states, errors, overlays, and navigation. Treat unexplained page-local styling as a defect when an equivalent shared primitive already exists.
- Equivalent controls should look and behave consistently across Home, Teams, Schedule, Standings, Score, Messages, Profile, and admin surfaces. After changing a shared token/component, inspect representative sibling routes so a local fix does not create a new contrast/legibility regression elsewhere.
- Favor a small reusable palette and predictable hierarchy. Pool-inspired texture/personality comes after readability and consistency.
- Use Pa11y with `WCAG2AA` and a zero-error threshold for changed user-facing routes when the repository supports it; prefer both `htmlcs` and `axe` runners where practical. Do not ignore/threshold away findings just to make CI green. Suppress only documented false positives or track the unresolved defect explicitly.
- Automated accessibility checks are evidence, not complete proof. Manually verify keyboard operation, focus order/visibility, accessible names/roles, selected/current state, zoom/text resize, reflow, and screen-reader/status semantics for changed workflows.
- Reuse existing routes/components/patterns before creating parallel surfaces.
- Add/update page tests for changed interactions and preserve end-to-end workflow continuity.
- Do not spend significant effort on demo/War Games polish while a real-product workflow remains broken unless the issue explicitly targets the demo.
