---
applyTo: "supabase/migrations/**/*.sql,src/supabaseAuth.js,src/*Repository.js"
---

Read `AGENTS.md` and the current issue before changing persistence/auth behavior.

- Reconcile repository migration history with the relevant hosted Supabase environment before applying database work.
- Prefer new forward migrations; do not rewrite migrations that may already be applied.
- Preserve RLS, grants, actor/team/admin authorization, audit history, and staging/production isolation.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or other privileged secrets.
- Keep browser-safe publishable keys distinct from server-only privileged credentials.
- Critical invariants must not rely on browser validation alone.
- Captain contact is an activation invariant, not a UI-only rule: enforce required phone readiness when an active captain membership is created/changed and when a season becomes active, so admin assignment, captain transfer, and future mutation paths cannot bypass it.
- When an invariant depends on whether a player has played any competitive rack, reconcile both rack-history stores: legacy `public.player_match_racks` and current dual-score `private.player_match_score_submissions.racks`. Do not substitute finalized-match or match-count checks for rack existence.
- Add a regression test for database defects, especially ambiguous PL/pgSQL identifiers/conflict targets and authorization boundaries.
- If a hosted hotfix is unavoidable, immediately add the matching repository migration and prove convergence.
