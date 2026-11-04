# Guarded captain principal bootstrap (#3645)

This is fixture preparation for #3643, not an eight-team season or gameplay
proof. The full-season persona flag remains disabled.

The optional bootstrap step runs only when repository variable
`JFL_BOOTSTRAP_FULL_SEASON_ACTORS` is exactly `1`. Absent/off leaves the original
mandatory two-captain reset/browser sequence intact. This is separate from the
persona activation flag and never proves the eight actors exist. Refresh the
authorized `SUPABASE_ACCESS_TOKEN` credential and qualify this setup path before
opting in; an observed HTTP401 on run40451760075 created zero principals. Do not
try alternate identities or apply the fixture through another control plane.
With explicit opt-in, any bootstrap failure still stops reset and browser.
No step uses `continue-on-error` or bypasses the original regression gates.

The trusted `reset-fixture` job first verifies its exact permanent-JFL checkout,
then waits for that SHA on the canonical JFL deployment. It runs the bootstrap
before the existing two-captain reset. The browser job depends on successful
completion of both steps. The existing workflow concurrency group owns the
whole fixture interval; no other reset, browser mutation, or SQL mutation may
overlap it. `SUPABASE_ACCESS_TOKEN` is available only in the ephemeral hosted
setup step, never the browser job. Repository/ref/actor/job/SHA guards reject
manual local execution, feature branches and public PRs.

The Management API project is pinned to `oqkkvqkerusepyokzbmt`. One transaction
can add only eight auth placeholders, eight `jfl.players` and eight reserved
fixture contacts. Existing default player-insert behavior creates their
provisional rating rows. It creates no identities, sessions, usable passwords,
admin grants, teams, season registrations, memberships, appearances or scores.
The placeholders are also banned from login indefinitely; the separately
authenticated allowlisted tester uses the existing server-side persona path.

For ordinal **n = 1..8**, the exact mapping is:

| Item | Identity |
| --- | --- |
| Persona | `full-season-captain-n` |
| User | `36430000-0000-4000-8000-` + n padded to 12 digits |
| Player | `36430000-2000-4000-8000-` + n padded to 12 digits |
| Email | `full-season-captain-n@jfl.persona.invalid` |
| Player name | `TEST Full-season Captain n` |
| Contact | Reserved fixture number +1 206 555 0131 through 0138 |

Initial creation requires the fixed private QA lab and reviewed player-insert
trigger definitions. Because the existing registration trigger enrolls every
new player when exactly one registration season exists, bootstrap refuses that
state. It briefly locks JFL seasons while creating the principals, preserving
the checked registration count. It never disables or changes a trigger.
Unexpected auth/contact/rating triggers, player trigger drift, ID/email/player/
contact collisions, cross-lane player binding, credentials, login activity,
sessions and league-admin grants all stop qualification. Partial existing
principal sets are not repaired automatically.

Initial bootstrap captures and rechecks 17 original JFL table hashes within the
same transaction, immediately around the eight inserts. Only the eight new
global player/contact/rating rows are excluded. Any other change rolls back the
entire bootstrap. This interval deliberately ends before the subsequent trusted
reset, whose authorized fixture changes would invalidate an earlier baseline.

Once all eight exact mappings already exist, replay only verifies them and
returns without inserts, timestamp updates or changes to their legitimate
subsequent QA season history. A separate read-only Management API query verifies
all eight mappings after the transaction. HTTP429, transport failure, malformed
data or failed read-back stops the job without an automatic write replay.

## Verification and removal

`test/full-season-actor-bootstrap.test.js` covers setup trust, exact-health
sequencing, pinned transport, sanitized failures, no replay and credential
isolation. `scripts/verify-jfl-full-season-actors-local.mjs` accepts an absolute
path to an externally installed, pinned `@electric-sql/pglite@0.5.12` module. It
runs the actual seed/removal SQL against minimal isolated PostgreSQL tables
and captured current trigger bodies. Local PG18 is separate from hosted PG17
acceptance; do not claim one establishes the other.

Before release, record current hosted original season/history hashes. After
trusted bootstrap and the completed browser job/restorations, independently
read back eight exact principal/player/contact mappings, credential/session/
admin absence, current SHA/date and original history. Do not close #3643 on
principal creation: its additional captain lineup/scoring authorization and
private eight-team fixture remain to be proven.

`scripts/rollback-jfl-full-season-actors.sql` is a reviewed emergency removal
candidate for the complete **unused** fixture. It is not called automatically.
It locks and verifies the eight exact principals, inspects all current incoming
foreign keys, and refuses any attached history, season/admin state, unexpected
delete trigger or composite dependency. Only the eight owned contacts/ratings,
players and users may be deleted. An actor already used in a season needs a
separately scoped, qualified history-aware cleanup; never cascade through it.
For any actual removal, acquire the fixture lease, refresh metadata/ownership,
first qualify transaction rollback, then commit and independently verify the
original baseline. Do not remove principals while their feature is enabled.
