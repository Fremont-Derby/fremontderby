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
