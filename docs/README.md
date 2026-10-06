# Fremont Derby documentation map

Use this page to find durable repository documentation without treating every Markdown file as required reading.

## Start here

1. [`AGENTS.md`](../AGENTS.md) — authoritative repository operating contract for agents.
2. [`README.md`](../README.md) — product, architecture, environment, and contributor orientation.
3. [`AGENTIC_DEVELOPMENT_PROGRAM.md`](AGENTIC_DEVELOPMENT_PROGRAM.md) — current JFL/DRU collaboration model.
4. [`AGENTIC_PROGRAM_STATUS.md`](AGENTIC_PROGRAM_STATUS.md) — living program-status guidance; reconcile it with current GitHub and hosted evidence.
5. The active GitHub issue, dependencies, overlapping PRs, CI, and live environment evidence for the work being attempted.

JFL and DRU sessions must also read both lane guides under `.github/agents/`.

Do not crawl all of `docs/` before starting work. Read the smallest relevant set and follow links from the active issue or authoritative guidance.

## Authority and freshness

When sources disagree, use the hierarchy defined in `AGENTS.md`: current product-owner direction and current issue requirements first, then current code/tests/hosted evidence, then repository operating guidance.

Documentation has three freshness classes:

- **Living guidance/status** — expected to reflect the current program and should be updated when material direction changes.
- **Stable reference/runbook** — updated when the represented system or procedure changes.
- **Historical evidence/spike** — preserved for context; never assume it describes current behavior without revalidation.

A file being newer, longer, or linked from an old issue does not make it authoritative.

## Agent and program guidance

Living guidance that shapes autonomous work:

- [Agentic development program](AGENTIC_DEVELOPMENT_PROGRAM.md)
- [Agentic program status](AGENTIC_PROGRAM_STATUS.md)
- [Agent bootstrap](agent-bootstrap.md)
- [Agent collaboration](agent-collaboration.md)
- [Do-work protocol](do-work-protocol.md)
- [12-hour executive review](agentic-12-hour-executive-review.md) — living delivery-system review once merged to `main`; material updates only.

Lane/specialist instructions live under `.github/agents/` and `.github/instructions/`, subordinate to `AGENTS.md`.

## Architecture and product reference

Stable product/system references include:

- [Architecture](ARCHITECTURE.md)
- [API reference](API_REFERENCE.md)
- [Environments](ENVIRONMENTS.md)
- [Product surface catalog](product-surface-catalog.md)
- [Project cohesion](project-cohesion.md)
- [UX controls and status](ux-controls-and-status.md)

Use current code/tests/live behavior to resolve drift between reference prose and implementation.

## Operations, deployment, and runbooks

Operational documents are procedures, environment contracts, and recovery/deployment guidance:

- [GitHub Actions inventory](GITHUB_ACTIONS.md)
- [Playwright self-hosted runner plan](PLAYWRIGHT_SELF_HOSTED_RUNNER_PLAN.md)
- [Backup/audit/recovery](ops-backup-audit-recovery.md)
- [Change safety net](change-safety-net.md)
- [Beta environment](beta-environment.md)

Operational instructions involving security, deployment, auth, or hosted state must be validated against the current environment before mutation.

## QA and validation

Validation contracts and test-driving guidance include:

- [Browser UX validation](WORK_BROWSER_UX_VALIDATION.md)
- [Season 1 test contract](SEASON1_TEST_CONTRACT.md)
- [Test-drive workflow inventory](test-drive-workflow-inventory.md)

Tests may intentionally reference exact documentation paths. Do not move validation contracts casually.

## Program status and executive reviews

Living status/review documents summarize current evidence; they do not override live GitHub or product state.

- [Agentic program status](AGENTIC_PROGRAM_STATUS.md)
- [12-hour executive review](agentic-12-hour-executive-review.md) — canonical recurring system-level review after #3290 lands.

Update recurring status/review documents when evidence materially changes the trend, decision, risk, or guidance—not merely because a timer fired.

## Historical evidence, spikes, and one-off plans

Documents under `docs/spikes/`, dated evidence, completed migration/release plans, and old investigation artifacts are historical unless an authoritative current document explicitly reactivates them.

Historical material should remain searchable, but agents must independently reproduce or revalidate its conclusions before using it as current product truth.

## Adding or reorganizing documentation

- Prefer updating an existing authoritative document over creating a near-duplicate.
- Give every new durable document a clear purpose and freshness class.
- Link important new docs from this map or a more specific authoritative index.
- Preserve stable paths when tests, runbooks, issues, or agent guides depend on them.
- Move/rename files only when the navigation benefit outweighs reference churn, and update all deterministic references in the same tracked change.
- Put transient implementation state in GitHub issues/PRs rather than creating permanent Markdown snapshots.
