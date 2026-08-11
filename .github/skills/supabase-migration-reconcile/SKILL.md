---
name: supabase-migration-reconcile
description: Compare Fremont Derby repository migrations with hosted Supabase staging/production state and safely converge them without losing RLS or environment isolation.
---

Use when a task touches Supabase schema, RPCs, triggers, RLS, grants, or migration drift.

1. Read `AGENTS.md` and the relevant issue.
2. Identify the exact target environment before executing anything.
3. List repository migrations and applied hosted migrations; compare names and actual schema/function/index state when ledger drift is suspected.
4. Do not assume equal migration counts mean equal schema.
5. Prefer a new forward migration. Do not rewrite or blindly replay an already-effectively-applied migration.
6. Preserve RLS, grants, authorization, historical data, and environment isolation.
7. Never reveal or commit privileged secrets.
8. After change, verify the intended object/function behavior, migration state, RLS/security advisors, and matching repository source.
9. Record any intentional history discrepancy or follow-up in GitHub.
