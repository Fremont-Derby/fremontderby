# #336 hosted validation status

Staging project `oqkkvqkerusepyokzbmt` successfully compiled `admin_season_team_assignment`.

Verified after apply:

- `anon` cannot execute either new RPC.
- `authenticated` cannot execute either new RPC.
- `service_role` can execute both new RPCs.
- The assignment command independently requires `private.league_admins` membership and takes the existing per-season capacity advisory lock.

Staging currently does not contain representative season/team fixtures, so successful candidate classification and mutation with realistic data must be covered by automated fixtures and then the two-human browser acceptance pass. Production promotion waits for green PR CI and merge.
