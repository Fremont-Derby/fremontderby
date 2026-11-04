# JFL scoring recovery transport qualification

Tracks #3686, supporting #3288 / #2800. **Proposed protocol; not an executor or hosted authorization.**

## Current boundary

Source #3685 at `375f38e92426a7a60060201b305f8680c3f026fa` proves local native PostgreSQL committed recovery. It does not qualify the hosted migration service. The connected SQL tool requires DDL through `apply_migration`; never bypass that restriction with dynamic SQL. The DRU executor is not a JFL transport.

The public [Supabase MCP implementation](https://github.com/supabase/mcp/blob/main/packages/mcp-server-supabase/src/platform/api-platform.ts) forwards migration name/query to the management API and discards successful query results. Client forwarding establishes neither server atomicity nor history semantics. A locally simulated endpoint cannot establish those facts either.

The [current migration API reference](https://supabase.com/docs/reference/api/v1-apply-a-migration) documents query, optional name and optional rollback strings, returning an empty success object. It does not document transaction framing. The separate rollback-migrations endpoint is not authority to roll back shared history; do not substitute it for exact candidate-pinned compensation. A rollback string is not evidence that compensation ran or is atomic.

Select the connected migration service only after the following qualification succeeds. Direct psql would require a separately reviewed credential, endpoint, TLS and transaction plan; it is not an automatic fallback. Do not provision credentials or broaden tooling as part of this document.

## Source payloads

The source-only generator `scripts/build-score-ownership-recovery.mjs` now emits two recovery forms from the same canonical executable body. `scripts/sql/jfl-ordinary-score-ownership.recovery.sql` owns its BEGIN/COMMIT. `scripts/sql/jfl-ordinary-score-ownership.recovery-body.sql` requires the qualified caller/service to own the transaction. Select exactly one framing after actual service qualification; never strip transaction statements from SQL or submit the unframed body as separate statements.

`scripts/sql/jfl-ordinary-score-ownership.artifacts.json` inventories exact on-disk byte lengths and SHA-256 digests for the candidate, both recovery forms, baseline and captured dependencies. Narrow LF attributes preserve those bytes across Windows and Linux. The disposable native harness validates the inventory before connecting and exercises both transaction forms, including committed compensation and refusal cases. This inventory is static source provenance only: it has no execution owner, review agreement, fresh hosted identity, exclusion interval or history plan, and grants no hosted execution authority. The runtime manifest below remains required.

## Release and exclusion manifest

`scripts/lib/jfl-sql-manifest.mjs` implements source-only preparation and binds outcome classification to a prepared run. `compileJflSqlPayloads` deterministically prefixes the candidate and canonical recovery body with numeric `SET LOCAL` lock, statement and idle timeouts. It adds no transaction statements. The native harness exercises these exact prefixed bodies inside its simulated service-owned transaction, including committed compensation and refusal cases. That simulation does not qualify the hosted service.

`prepareJflSqlExperiment` takes exact manifest/inventory Buffers, a Map of the seven artifact Buffers and independently established context. It validates the inventory against the review-pinned SHA256 before checking every artifact, then compares both final prefixed payload digests with the manifest. Returned payload strings and plan are immutable; input mutation cannot change prepared bytes. Only service-owned framing is currently preparable: the candidate has no explicit-transaction artifact. A service found to require payload-owned framing needs another reviewed implementation, not automatic wrapping.

The runtime JSON contract is schemaVersion 1, card 3686, UUIDv4 runId, ownerLane `jfl`, execution owner, project/environment/schemas/healthUrl, sourceSha, expectedDeployedSha, review `{jfl,dru}` comment URLs on #3686, exclusion `{id,startsAt,endsAt,jfl,dru}`, timeouts `{lockMs,statementMs,idleMs,clientMs}`, transport `{kind,framing,qualification}`, history `{installName,recoveryName,treatment}`, inventorySha256 and payloadSha256 `{install,recover}`. Times use exact UTC ISO milliseconds. Intervals are at most one hour; the client deadline must fit inside the remaining interval. History names are distinct `jfl_3686_` names and treatment is `retain-records`.

Context must supply current time, independently reviewed source/inventory pins and agreement URLs, acknowledged exclusion ID, qualified service framing/qualification reference, unused migration names from fresh history read-back, and a canonical health response observed within the interval and last120seconds. Essential project/schema/isolation checks must each appear exactly once and pass. This library validates supplied values; it **does not fetch or authenticate** reviews, health, history, fixture ownership or transport qualification. A matching URL is not proof of agreement. The future authorized caller must establish those facts independently and revalidate immediately before submission. No runtime manifest for the actual hosted experiment is approved yet.

`classifyJflSqlRunOutcome` accepts only a plan prepared in the same process. It binds independent evidence to run ID, exact manifest/payload/source/deployed identity, project and submission/read-back times before using the existing no-replay outcome classifier. Missing or cross-run evidence retains exclusion. An expired interval cannot permit recovery mutation; independently proven restoration can still be recorded after expiry. Evidence authenticity, writer termination, catalog/history equality and absence of overlap remain the collector's responsibility. Every prepared plan reports `executionAuthorized:false`; no endpoint caller, credential lookup or SQL submission is introduced.

Before any hosted qualification, record a private manifest with:

- Card, JFL execution owner, explicit DRU agreement for shared migration-history effects, and reviewed source SHA.
- Exact project `oqkkvqkerusepyokzbmt`, environment `jfl`, schemas `jfl` / `jfl_private`, and canonical health URL `https://jfl.fremontderby.com/health/environment`.
- Expected deployed SHA, currently `5924e674f9fb0464fbe314e8e02839ca7b3bbf8b`. A different healthy SHA requires fresh reconciliation, never automatic substitution.
- SHA-256 of the exact UTF-8 payload bytes, candidate and recovery files, dependency fixtures and baseline catalog. Do not use Git blob IDs as payload SHA-256 or hash PowerShell-rendered output.
- One unique migration name per approved probe; intended history delta and cleanup treatment for every name. Names must not collide with source migrations or earlier runs.
- Exclusive fixture interval covering SQL/reset/browser/deploy activity; both lanes acknowledge the shared-project interval. Process absence alone is not ownership.
- Bounded server lock/statement/idle timeouts and client deadline, chosen and recorded before execution. No unbounded waits or mutation retries.
- Recovery owner, exact recovery payload, independent read-back route and stop conditions, prepared before candidate installation.

Refuse a missing field, unknown endpoint/project, changed digest or expired exclusion interval. No public logs may contain connection strings, credentials, row contents, player identities or notification bodies.

## Qualification payloads and evidence

First prove transport semantics on an explicitly reviewed disposable object in `jfl_private`, not on score functions or league rows. The exact object and payloads belong in the dedicated implementation PR before execution. Use no `CASCADE`, persistent public grants or security-definer probe routines. Agree with DRU on shared history entries; never delete or rewrite history to hide experiments.

| Probe | Required independent read-back | Meaning |
| --- | --- | --- |
| Successful atomic create and cleanup | Exact expected catalog delta plus the documented migration-history delta | Baseline success, not full transport acceptance |
| Deliberate failure after creating the probe object | Object absent and history outcome recorded | Detects partial DDL or unexpected history persistence |
| Bounded statement timeout after an earlier probe change | Object absent and history outcome recorded after transaction termination | Establishes abort behavior on the actual service |
| Response loss after server submission | Independent catalog and history classify the outcome; original request is never resubmitted | Unknown client result is not rollback |
| Cleanup refusal caused by an unexpected dependency | No partial cleanup, no cascading removal, original state retained | Refusal preserves unrelated objects |

The response-loss case requires a reviewed test mechanism that loses only the response, without alternate credentials/routes or bypassing throttling. If the connector cannot support this case, record it as unproven and keep the execution gate closed. Do not deliberately overload the service.

A request status alone cannot establish any row in this table. Query catalog and migration history through an independently completed read-only request after the writer transaction is known to have ended. Use exact object definitions, owner, security-definer flag, search path, ACLs and dependencies, not merely object existence. If a timeout leaves termination uncertain, retain exclusion and stop; do not race a second writer.

## Transaction framing trap

The two #3685 source artifacts have different framing:

- `scripts/sql/jfl-ordinary-score-ownership.candidate.sql` has no outer transaction; the local harness supplies one.
- `scripts/sql/jfl-ordinary-score-ownership.recovery.sql` already contains `BEGIN` and `COMMIT`.

Do not wrap recovery blindly. [PostgreSQL does not nest BEGIN blocks](https://www.postgresql.org/docs/current/sql-begin.html): its inner `COMMIT` can end an outer transaction before transport bookkeeping. Similarly, do not inject timeout settings before the candidate and assume they survive a separate request or pooled session.

The implementation must qualify whether the service owns the transaction and writes migration history inside it. Produce a reviewed, digest-pinned payload for that exact framing. Do not strip `BEGIN` / `COMMIT` with a regex. Any generated unframed recovery variant needs an explicit source contract and the same native committed-recovery/negative-control tests as the original. Until then, do not submit the existing recovery file to a possibly transaction-wrapping migration service.

## Candidate experiment after transport acceptance

1. Reconcile health, fixture exclusion, catalog/body/security pins and migration history against the approved manifest. Candidate guard must be absent. A baseline mismatch refuses installation.
2. Capture private aggregate data fingerprints for affected scoring, claim and audit relations; retain names, row counts and hashes rather than exporting rows. Record canonical ordering and null representation. Capture peer schema catalog fingerprints sufficient to detect adjacent effects.
3. Submit the complete approved candidate transaction once. Independently qualify eight installed RPCs and the guard; no user/fixture mutations are authorized by installation.
4. Submit the approved compensating recovery once, only against the exact installed-candidate pins. Restore eight original RPCs before removing the exact guard with `RESTRICT`.
5. Independently prove baseline catalog and data equality, guard absence, peer preservation and the agreed migration-history delta. Recovery means committed compensation, not aborting an uncommitted install.
6. Release exclusion only after restoration is proven. Preserve sanitized evidence on #3686 and #3288. Full product acceptance still needs bundled/live two-device journeys and independent DRU review.

## Unknown outcomes

| Observation | Action |
| --- | --- |
| Submission not attempted | Fix the preflight without changing hosted state |
| Client error, signal, deadline, HTTP 429 or ambiguous success | Mark unknown; preserve journal and exclusion; no automatic replay |
| Exact baseline, guard absent, history consistent with rollback | Record proven rollback; a fresh attempt requires explicit requalification |
| Exact candidate plus guard, history consistent with committed install | Use only the pre-reviewed recovery after confirming writer termination |
| Mixed/changed catalog, unexplained data/history or active writer | Stop mutation; request scoped investigation; never force recovery |
| Exact restored baseline and expected history | Record verified restoration and release exclusion |

A nonzero exit, process signal or missing exit code is not success. Sanitization must cover both stdout and stderr. Never print raw SQL errors that might include private values. Do not automatically retry using a differently encoded password or alternate route.

## Implementation acceptance still outstanding

This document is reviewable design evidence only. #3686 stays open until a dedicated source/local implementation and failure tests pass, both lanes explicitly agree on shared effects, the supported hosted service semantics above are independently proven, and restoration is verified. No scheduler, deploy workflow, endpoint caller or new secret is introduced here.
