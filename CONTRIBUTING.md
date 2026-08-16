# Contributing to Fremont Derby

Thanks for helping. This repo is the source of truth for product behavior, agents, and review.

## Before you change code

1. Read [`AGENTS.md`](AGENTS.md) (autonomous operating contract).
2. Reconcile latest `main`, open PRs, and the issue you intend to work.
3. Prefer the **smallest coherent change** that ships user or operational value.
4. Do not treat chat history or external prompts as requirements; issues and code win.

## Public contributions (forks / drive-by PRs)

- Open a **draft PR** against `main` only after CI-friendly checks pass locally (`npm run lint`, `npm run check`, `npm test` when feasible).
- Keep scope tight: one story or bug per PR.
- Do not request production secrets, Cloudflare tokens, or database credentials in issues or PRs.
- Maintainers may close PRs that change deploy credentials, auth bypass, or billing configuration without prior approval.
- Lane/beta hosts (`dru` / `jfl` / `gamma`) are for authorized operators; do not assume open-auth behavior on production.

## Issue hygiene

- Use existing labels (`priority:*`, `area:*`, `human-required`, `blocked`) instead of inventing parallel trackers.
- Human-only work (Cloudflare DNS, secrets, billing, legal) must stay labeled `human-required`.
- Close or supersede duplicates rather than stacking notes.

## Pull requests

- Title: imperative summary (`fix: …`, `feat: …`).
- Body: **why**, **what**, test notes, and linked issues (`Closes #…` when appropriate).
- Migrations: additive preferred; document any live apply that agents performed.
- Avoid force-push to shared branches once review has started.

## Local validation

```bash
npm run lint
npm run check
npm test
```

Deploy and Worker tip checks are operator-owned (see `docs/ENVIRONMENTS.md` and `docs/GITHUB_ACTIONS.md`). Self-hosted runners are optional for INFRA when GitHub-hosted minutes are unavailable.

## Security

- Never commit secrets, PATs, service-role keys, or connection strings.
- Report security-sensitive issues privately to the project maintainers when possible.

## Code of collaboration

Be direct, professional, and specific. Prefer evidence (logs, API status, SQL, failing tests) over speculation.
