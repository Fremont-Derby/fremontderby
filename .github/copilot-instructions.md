# Fremont Derby GitHub Agent Instructions

Before making changes, read the current root `README.md` and `AGENTS.md` from `main` and follow them as the shared contributor/agent contract.

Then read the current issue, linked parent/dependency issues, open overlapping PRs, and the relevant code/tests/platform state. Do not rely on stale prior-session context.

Use the repository's layered instructions instead of carrying a large copied prompt:

- `.github/agents/` contains specialist profiles for orchestration, UX, admin/ops, rules, core league/data, QA/release/security, platform/SRE, communications, analytics, and integrations.
- `.github/instructions/` contains path-specific safety and quality rules that apply when touching sensitive surfaces.
- `.github/skills/` contains repeatable deep procedures that should be loaded only when relevant.
- `docs/agent-collaboration.md` explains lane boundaries, concurrency, and GitHub handoffs.

Issue-specific requirements and current priorities belong in GitHub issues; durable autonomous operating guidance belongs in `AGENTS.md`; the minimal external bootstrap lives in `docs/agent-bootstrap.md`.
