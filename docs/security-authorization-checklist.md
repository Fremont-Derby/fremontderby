# Authorization checklist (service-role data plane)

Every new or changed endpoint that uses `SUPABASE_SERVICE_ROLE_KEY` must answer:

1. **Authenticate** — `authenticateSupabaseUser` (or explicit public route)?
2. **Actor** — is `actorUserId` taken only from the authenticated user (never from body for identity)?
3. **Authorize** — membership / captain / league-admin asserted in the **command** before writes?
4. **Scope** — can this actor only touch their team/season/match resources?
5. **Errors** — 401 vs 403 vs 404 do not leak other players’ PII?
6. **Tests** — at least one test that an unprivileged actor is rejected?

Admin UI visibility is **not** authorization.
