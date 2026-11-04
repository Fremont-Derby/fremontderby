# JFL matchup chat retirement

Tracks #3307 under #3295. General Chat, Team Chat, and Direct Messages are the only JFL social channels. There is no fourth preference.

JFL Schedule emits score actions without matchup Messages links. Messages never loads matchup inboxes or renders matchup threads. Legacy `/messages?matchup=...` links explain retirement and offer Schedule and Profile recovery.

Authenticated discovery returns an empty inbox. Legacy send and read-marker POSTs return HTTP 410 before reading a body or invoking an RPC. Authentication still runs first. Historical GET, reports, and moderation retain their existing authorization paths.

The JFL-only migration replaces send/read-marker RPCs with unconditional SQLSTATE 42501 denial and makes matchup discovery empty. Storage triggers reject all message inserts, all read-marker inserts/updates, and message updates except moderation metadata (`removed_at`, `removed_by`). Tables and existing records are retained. The migration guards the three original function hashes to stop on hosted drift. Other lane schemas and behavior are unchanged.

## Verification

- `node --test` covers authenticated retirement, invalid/stale bodies, empty discovery, notification exclusion, retained history calls, and lane isolation.
- `PLAYWRIGHT_RETIREMENT_SOURCE=1 npx playwright test browser/jfl/matchup-chat-retirement.spec.js` checks signed-out legacy links, all channels OFF, and supported-channel sends on desktop and 320px phone.
- The deployed browser run requires `PLAYWRIGHT_EXPECTED_SHA` and reads exact JFL health first. API traffic is intercepted with synthetic fixtures; it is deployed HTML proof, not a live message-write or self-hosted captain replay.
- `scripts/verify-jfl-matchup-chat-retirement.sql` uses the established synthetic QA captains and rolls back every write. It checks all-three-OFF availability, both lineup submissions, generated scorecard access, rack scoring/undo, Notices reads/read markers, retired RPCs, direct storage inserts, and browser privilege denial. It refuses an occupied QA matchup instead of resetting peer work.
- Read/report/moderation function hashes, unchanged other-lane function digests, retained row counts, and security advisor comparison supplement the rollback proof. The pre-retirement JFL matchup message/read tables contain zero rows, so no real historical body or removal is claimed as tested.
- Independent DRU adversarial confirmation remains an acceptance requirement on #3307. JFL's own proof does not replace that review.
