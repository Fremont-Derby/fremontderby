---
applyTo: "src/*Page.js,src/appShell.js,src/publicPages.js"
---

Read `AGENTS.md`, the current issue, and the real user flow before changing UI.

- Prefer mobile-first, touch-friendly, low-scroll workflows.
- Normal users should choose people, teams, dates, rounds, and matchups—not paste UUIDs, access tokens, or service keys.
- Preserve browser session authentication; do not solve UX problems by weakening server authorization.
- Make errors visible, plain-language, dismissible when appropriate, and accessible to assistive technology.
- Treat loading, signed-out, expired-session, empty/no-data, unavailable, and failure states as first-class interaction states: explain what happened and provide one context-appropriate next action.
- Do not show placeholder zeroes or success/readiness language before real data resolves.
- On auth-gated management pages, do not paint usable-looking mutation controls, private management panels, or authenticated placeholder content before session/auth state resolves. Show one honest loading or signed-out surface first, then reveal authorized controls only after a usable session is confirmed.
- Hide unusable forms/controls or clearly disable them with the reason nearby; do not leave inert controls that look actionable.
- Important state/status changes should use accessible live-region semantics where appropriate, and meaning must never depend on color alone.
- Recovery actions should remain keyboard reachable, visibly focused, at least 44px where they are primary touch controls, and easy to reach on narrow phones.
- Do not solve dense phone layouts by forcing wide tables into horizontal scrolling. Preserve semantic relationships, but adapt tables into wrapping rows/cards or compact responsive grids so names, state, and primary actions remain visible without sideways hunting.
- When a mobile table carries row actions, keep the row identity and action together on screen; do not require users to remember a player/team from an off-screen column while scrolling sideways to act.
- Reuse existing routes/components/patterns before creating parallel surfaces.
- Add/update page tests for changed interactions and preserve end-to-end workflow continuity.
- Do not spend significant effort on demo/War Games polish while a real-product workflow remains broken unless the issue explicitly targets the demo.
