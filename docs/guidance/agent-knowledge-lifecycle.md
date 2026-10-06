# Agent knowledge lifecycle

## Purpose

GitHub issues and comments are execution records. Durable repository documentation is the home for reusable instructions, product contracts, operating rules, and lessons that should survive the card that discovered them.

## Rule

When a card/comment establishes guidance that future agents should follow after that card closes, capture it in the appropriate canonical document before treating the learning as complete.

Use:
- `docs/guidance/` for agent operating rules and collaboration methods;
- `docs/reference/` for enduring product/domain contracts;
- `docs/operations/` for deployment, environment, recovery, and operator procedures;
- `docs/validation/` for reusable proof/test contracts;
- `docs/status/` for living program state and executive reviews.

Cards own scope, acceptance, ownership, dependencies, and evidence for a specific unit of work. Comments own chronological evidence, decisions, and handoffs. Neither should become the only durable source for a reusable rule.

## Promotion test

Promote issue/comment knowledge into docs when at least one is true:
1. another agent/session will need the rule after the issue closes;
2. the decision changes how multiple future cards should be implemented or validated;
3. the lesson prevents a demonstrated recurring failure mode;
4. it defines an enduring product/domain contract;
5. it is an operational/runbook procedure likely to be reused.

Do not promote transient SHAs, temporary blockers, one-off reproduction data, routine progress, or card-specific acceptance evidence.

## Avoid duplication

The canonical doc owns the reusable rule. The card should link to that document and retain only work-specific scope/evidence. If a durable rule changes, update the canonical doc in the same tracked change when practical.

Do not maintain competing copies of policy in several issues, comments, and Markdown files.

## Review discipline

Program/agent retros should explicitly ask: **Did this run discover an enduring instruction or lesson that exists only in an issue/comment?** If yes, either promote it to docs or record why it is intentionally local/transient.
