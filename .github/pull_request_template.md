## Tracking card
<!-- Required. Use `Tracks #123` or `Refs #123`. Do not normally use `Closes #123`; the card must stay open through post-merge verification. -->

## Problem
<!-- What user, operational, reliability, or maintenance problem does this solve? -->

## Owner lane / agent
<!-- Orchestrator / UX / Admin-Ops / Rules / Core-League / QA-Release / Platform-SRE / Public-Relations / JFL / DRU / other -->

## Scope
<!-- What changed? Keep this narrow and outcome-oriented. -->

## Touched surfaces
<!-- Material files, routes, migrations, schema, shared styles, config, APIs, or domain behavior changed. This helps parallel agents detect collision risk. -->

## Out of scope
<!-- What related work is intentionally not part of this PR? Create/link follow-up cards instead of silently expanding scope. -->

## Test-driven evidence
<!-- Behavior-bearing work follows docs/test-driven-development.md. RED must predate the behavior implementation and fail for the expected reason. Use the justified exception only for work where a conventional RED-first test adds no value or would make an emergency less safe. -->

### RED evidence
<!-- Test/check name, exact command, and the expected failure reason observed before implementation. -->

### GREEN evidence
<!-- Focused test/check passing after the smallest implementation change. -->

### Regression evidence
<!-- Adjacent suite + required CI/checks. Distinguish source/test/staging/live proof. -->

### Refactor
<!-- What was improved after GREEN while tests remained green? Use `None` when no refactor was needed. -->

### TDD justified exception
<!-- `None`, or explain why RED-first was not meaningful/safe and name the substitute validation. Docs-only/copy-only/purely visual work should not invent fake tests. -->

## Proof
<!-- Additional E2E, staging, production, migration/security, or human acceptance evidence. Distinguish each level of proof. -->

## Collision check
- [ ] Started from current `main`.
- [ ] Checked open PRs/cards for overlapping work before implementation.
- [ ] Rechecked overlap/current `main` before merge.
- [ ] No unrelated sweeping formatting/refactor/cleanup is bundled into this PR.
- [ ] I never checked out or mutated another agent's branch; handoffs transfer cards, not branches.

## Risk / safety
<!-- Auth, RLS, data, migrations, environment isolation, compatibility, rollback, shared-file collision, or other meaningful risk. -->

## Merge readiness
- [ ] Tracking card is at **Handoff / review**.
- [ ] RED evidence is recorded before behavior implementation, or a justified TDD exception is documented.
- [ ] GREEN and relevant regression evidence are recorded.
- [ ] Required tests/CI are green or an explicit approved exception is documented.
- [ ] Conflicts were resolved with both intended behaviors understood.
- [ ] Diff still matches the tracking card's acceptance criteria.

## Follow-up
<!-- Issues created/updated or durable docs/instructions improved. Use `None` when truly complete. -->

## Handoff
<!-- Complete every field. Use "Same as owner" or "None" only when accurate. For ownership transfer, also update the card labels and require explicit acceptance before the incoming agent edits. -->

- Outgoing owner:
- Requested incoming owner/reviewer:
- Completed:
- Remaining:
- Touched surfaces:
- Proof and known failures:
- Risks/blockers/collision concerns:
- Exact next action:
- Acceptance status: pending / accepted / review-only

## After merge
<!-- Do not close the tracking card at merge. Mark it Merged, perform appropriate post-merge verification, record evidence on the card, mark Verified, then close only after acceptance criteria are satisfied. -->
