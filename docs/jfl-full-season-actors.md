# Eight-captain full-season fixture (#3643)

The existing five personas and two-captain QA lab remain unchanged. Full-season
gameplay needs eight distinct team captains, not eight cookies mapped to one
actor. Dedicated keys `full-season-captain-1` through `full-season-captain-8`
map to users `36430000-0000-4000-8000-000000000001` through
`36430000-0000-4000-8000-000000000008`. Their addresses are the corresponding
`<key>@jfl.persona.invalid`. These IDs must never be bound to historical or real
players.

The registry is disabled by default. Only JFL with
`TEST_FULL_SEASON_PERSONAS_ENABLED` exactly `1` lists or accepts these keys.
Gamma retains its original five options even if that flag is accidentally set.
Production, DRU, staging, and unknown environments reject them. Every selection
still requires the existing bearer authentication, operator allowlist and
simulated-session rules. Cookies remain secure, HttpOnly, same-site, and bound
to the environment. They grant no league-admin or captain authorization by
themselves: the normal application must resolve real fixture memberships.

## Qualification before enabling

1. Reconcile exact JFL source/deployment and acquire exclusive fixture ownership.
   Finish all preceding reset/browser work and verify its cleanup first.
2. Through the established GitHub-hosted trusted-source setup path, qualify
   deterministic non-login auth placeholders and dedicated player mappings.
   Reject any ID/email/player collision. No passwords, identities or sessions
   may be provisioned. Do not update or rebind existing unrelated records.
3. Record eight exact user/player identities and their reserved fixture contact
   readiness. Establish private QA season ownership and a bounded cleanup
   journal. Preserve original season/history hashes and foreign-key guards.
4. Use supported Admin preparation/roster/eligibility flows for the actual eight
   teams. Do not seed competition scores, appearances, winners or captain
   permissions to make a product journey pass.
5. Enable the flag through a reviewed JFL-only config change after successful
   bootstrap and read-back. Verify additional captain selection and normal own
   lineup/scorekeeper/rack access; deny foreign-team, ineligible and stale
   actions. Capture SHA, fixture date and restoration evidence.
6. Hand the qualified identities/rosters to #3562 for 28 regular-season matchups,
   postseason and closure. Keep #3643 open until its hosted acceptance passes.

The initial registry and HTTP tests establish source authorization boundaries.
They do not establish hosted fixture creation, actual captain membership,
full-season gameplay, or permission to enable the flag before qualification.
