# “Do work!” protocol (current meaning)

When a collaborator says **Do work!** (or the hourly Grok loop runs), that is **not** permission to thrash the repo. It means: run the **change safety net**, fix what is red, then ship the highest-value **verified** increment.

## Priority order (always)

1. **Production name & DNS** — `npm run canary:dns`  
   If red: **Restore lane custom domains** first. Do not “fix” DNS with app code.
2. **Lane identity** — `npm run canary:lanes`  
   Wrong `environment` on a host is a deploy/bind problem, not a UI tweak.
3. **Public surface** — `npm run canary:surface`  
   Broken shells/routes after UI moves fail here; update `public-surface-contract.mjs` only when the product intentionally changes paths.
4. **CI / tests** — `npm test` for the slice you touched; do not delete tests to go green.
5. **Small ship** — focused PR, production/lane canary green, comment on blockers instead of silent half-fixes.

## In scope for Do work!

- Canary failures, domain diagnose/restore dispatch, flake fixes
- UI/route regressions called out by contract or surface canary
- Closing validated issues with proof (commands + URLs)
- Docs that keep agents from repeating the apex-DNS class of outage
- Low-risk product polish that keeps canaries green

## Out of scope unless explicitly requested

- Payment / billing / paid GitHub product changes
- Pasting or rotating secrets in chat
- Broad refactors with no canary story
- “Go ham” volume of drive-by PRs that skip verification
- Infra mutation outside documented workflows (prefer `workflow_dispatch` scripts that already use Actions secrets)

## Definition of done for a Do work! session

- [ ] `npm run canary` green (or failures filed with exact command output)
- [ ] Any merged change has a revert story and does not leave apex/www unbound
- [ ] Issue/PR notes are professional (cheeky only when the human used “Do work!” as the cue)
- [ ] No claim of “fixed” without a probe (DNS, `/health`, or surface canary)

## Automation map

| Layer | Role under Do work! |
|-------|---------------------|
| Grok hourly loop | Judgment: pick next item from this protocol |
| CF cron + hourly Actions probe | Deterministic public path probes |
| Lane health monitor (15m) | DNS + env + CF bindings + surface |
| Public surface canary | Route/shell regression after UI/deploy |
| Restore / diagnose workflows | Break-glass for domain binding |

See also: `docs/change-safety-net.md`, `docs/apex-dns-incident-guard.md`, `docs/hybrid-hourly-automation.md`.
