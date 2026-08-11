---
name: mobile-ux-review
description: Review a Fremont Derby player/captain workflow for fast mobile task completion, discoverability, accessibility, and unnecessary technical friction.
---

Use for common player/captain browser flows.

Review the workflow as a phone user trying to complete one real task quickly.

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
11. When a form or control cannot be used, is it hidden or clearly disabled with the reason nearby rather than left looking broken?

State and recovery are part of the workflow, not decorative edge cases. Prefer one prominent recovery action such as Sign in, Try again, Join/apply, View tonight, or Open Teams over explanatory prose with no actionable next step.

Create focused issues for discovered friction. Prefer fixing the real product instead of a demo-only surface unless the issue explicitly targets the demo.
