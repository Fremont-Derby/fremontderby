---
applyTo: "src/*Page.js,src/appShell.js,src/publicPages.js"
---

Read `AGENTS.md`, the current issue, and the real user flow before changing UI.

- Prefer mobile-first, touch-friendly, low-scroll workflows.
- Normal users should choose people, teams, dates, rounds, and matchups—not paste UUIDs, access tokens, or service keys.
- Preserve browser session authentication; do not solve UX problems by weakening server authorization.
- Make errors visible, plain-language, dismissible when appropriate, and accessible to assistive technology.
- Reuse existing routes/components/patterns before creating parallel surfaces.
- Add/update page tests for changed interactions and preserve end-to-end workflow continuity.
- Do not spend significant effort on demo/War Games polish while a real-product workflow remains broken unless the issue explicitly targets the demo.
