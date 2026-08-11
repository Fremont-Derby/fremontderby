# Specialist Agent Collaboration

This document complements `AGENTS.md`. It describes how specialized agents collaborate through GitHub without requiring shared chat memory.

## Core lanes

- **Orchestrator / TPM** — reconcile state, prioritize, split/link issues, prevent duplicate work, and route work.
- **UX / Product Experience** — mobile/browser usability, accessibility, discoverability, and task completion.
- **League Admin / Ops** — season operations, registration/admin workflows, exceptions, and reduced manual administration.
- **Rules Referee** — rule consistency, edge cases, decision gaps, and rule-facing test/review work.
- **Core League / Data** — durable domain/data behavior, scoring, standings, scheduling, rosters, postseason, and integrity.
- **QA / Release / Security** — independent E2E, CI, authorization, RLS, migration, environment, and release proof.
- **Platform / SRE** — Cloudflare/Supabase infrastructure, secrets, deployment, monitoring, recovery, and capacity.
- **Public Relations / Comms** — onboarding, announcements, FAQs, help copy, release notes, and feedback synthesis.

Optional/on-demand lanes:

- **Analytics / Product Insights** — evidence-backed prioritization, workflow friction, operational metrics, and product signals.
- **Integrations / Research** — Fargo/external APIs, imports/exports, identity/provider research, and isolated integration work.

Profiles live in `.github/agents/` and refine, but do not replace, `AGENTS.md`.

## Concurrency rule

Specialization is useful only when agents are not fighting over the same files and decisions.

- Keep roughly 8 disciplines available.
- Limit simultaneous implementation lanes to about 4–5 when work overlaps shared runtime/database surfaces.
- Rules, QA, PR/Comms, Analytics, and Orchestrator should often review/triage/create issues rather than create competing runtime PRs.
- Before starting implementation, every lane checks current `main`, open PRs, and the relevant issue/dependencies.
- When another active PR owns the same behavior, review or hand off instead of duplicating it.

## GitHub is the communication bus

Do not depend on agent-to-agent chat history. Persist useful context in:

1. GitHub issues for current outcomes, blockers, dependencies, and follow-up work.
2. Pull requests for implementation scope, proof, risk, out-of-scope, and handoff.
3. `AGENTS.md`/README for broad durable operating knowledge.
4. `.github/instructions/` for path-specific guardrails.
5. `.github/skills/` for repeatable deep procedures loaded only when relevant.
6. Tests/code/migrations for executable product truth.

## Handoff pattern

A focused PR should state:

- problem;
- owner lane;
- scope;
- out of scope;
- proof at the appropriate level (tests/CI/staging/production);
- risk/safety notes;
- follow-up issues;
- recommended reviewer/next specialist lane.

The repository PR template encodes this pattern.

## Instruction improvement loop

When a cycle discovers a durable lesson:

- update `AGENTS.md` for broad autonomous behavior;
- update the appropriate agent profile for role-specific behavior;
- update path instructions for file/surface-specific safety rules;
- add or improve a skill for a repeatable procedure;
- update README for stable architecture/product orientation;
- keep transient priorities and one-off blockers in issues.

Do not expand the external scheduler prompt with current roadmap detail. `docs/agent-bootstrap.md` should remain a tiny pointer into the repository-owned instruction system.
