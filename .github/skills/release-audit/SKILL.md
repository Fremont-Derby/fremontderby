---
name: release-audit
description: Reconcile code, issues, PRs, CI, migrations, security posture, and live environments before declaring a Fremont Derby release path green.
---

Use for independent release/QA checks.

1. Read `AGENTS.md`, README, the release/parent issue, and current related issues.
2. Reconcile latest `main`, open/recent PRs, and CI.
3. Identify the exact user path or release gate being validated.
4. If database/auth/platform state matters, compare repository state to the relevant hosted environment and inspect RLS/security/environment readiness.
5. Run/inspect the smallest meaningful E2E plus repository-required validation.
6. Separate source proof, CI proof, staging proof, and production proof.
7. Fix only contained safe regressions; create a precise issue/blocker for broad implementation.
8. Reconcile issue/checklist state only when acceptance criteria are actually satisfied.

## Hosted staging readiness

Use `.github/workflows/staging-readiness.yml` when the release gate needs proof that the deployed staging Worker is actually using staging bindings rather than merely trusting `wrangler.jsonc`.

Provide the public staging Worker URL and the Git SHA expected to be deployed there. The workflow reuses `scripts/smoke-release.mjs` and records its evidence directly on #35.

A passing staging readiness run proves all of the following from the hosted Worker response:

- `/health` reports the expected Git SHA as `versionTag`;
- `/health/environment` reports `staging`;
- every environment-readiness check is green, including the expected staging Supabase project and presence of a distinct server-only service-role credential;
- `/demo` serves the current Try a League Night surface.

Do not infer staging readiness from repository bindings alone, and do not copy service-role values into workflow inputs, logs, issues, or docs. The readiness endpoint reports only presence/distinction checks, never secret values.

## Cloudflare-protected production smoke

If Cloudflare security challenges the GitHub Actions release smoke before the Worker is reached, do **not** weaken site-wide protection or treat a browser challenge as Worker health proof.

The repository smoke client can send the secret header `x-fremont-release-smoke` from the GitHub Actions secret `RELEASE_SMOKE_BYPASS_TOKEN`. The token value must never be committed, logged, copied into issue text, or exposed to browser code.

Configure Cloudflare with the narrowest possible skip rule:

- require an exact match on the secret `x-fremont-release-smoke` header value;
- restrict the rule to `fremontderby.com` and only `/health`, `/health/environment`, and `/demo`;
- skip only the security product/phases that are producing the false-positive challenge;
- keep logging enabled when practical;
- rotate the GitHub secret and Cloudflare rule together if the token is exposed.

Cloudflare's documented WAF Skip action can exempt legitimate monitoring traffic from selected security features, and custom rules can match a specific HTTP header value. Bot Fight Mode on plans where it cannot be skipped remains an external constraint; do not invent a repository bypass for a Cloudflare product that does not support one.

A successful bypassed smoke still must prove the exact Git SHA, `production` environment readiness, and current `/demo` surface. The bypass only gets the trusted monitor through edge security; it does not relax Worker assertions.
