# JFL QA evidence contract v1

Issue: #2262. Parent: #2261. Central persistence consumer: #2263.

This contract defines evidence produced by JFL human QA. It does not enable collection in production, Gamma, or DRU and does not choose a storage implementation.

## Record boundary

`schemas/qa-evidence-v1.schema.json` is the machine-readable envelope. Every record carries `schema_version: "1.0.0"` and `lane: "jfl"`. Producers validate with `validateQaEvidence` before enqueueing; consumers reject unsupported major versions and preserve unknown newer minor-version records without rewriting them.

Run identity and fixture/build facts are immutable. Events are append-only and idempotent by `(run_id, event_id)`. Assertions and human triage labels are separately addressable. Derived analytics or model features live outside the raw envelope and must point back to `run_id`; they never overwrite source evidence.

A replay creates a new `run_id` with `replay_of_run_id` pointing to the original. Reusing a seed never overwrites an earlier run.

## Semantic features

`fixture_facts` contains stable facts such as `race_complete`, `mismatch_present`, `target_class`, `participation_type`, or `upcoming_match_count`. Randomized player/team names and display strings are forbidden as predictive features. IDs used only to render a fixture are likewise excluded from derived datasets.

## Events and errors

Only three event types are accepted initially: `interaction`, `client_error`, and `server_error`. `QA_EVENT_FIELDS` is the field allowlist. Arbitrary DOM text, message content, request headers, URLs with query strings, and session material are rejected.

`normalizeQaError` removes query values, UUID/numeric identifiers, and exact stack coordinates before computing a SHA-256 fingerprint from error class, stable message template, route, action, and normalized stack location. A server correlation ID may join a safe server event to a run, but it must not encode account or session data.

## Privacy and retention

- Never accept authorization data, cookies, headers, passwords, tokens, email/phone fields, unrelated messages, arbitrary page text, randomized names, or full query strings.
- `tester_id` and `session_id` are pseudonymous opaque identifiers. They must not be hashes of an email or phone number without a separately managed secret.
- `note` is optional, potentially sensitive free-form input. Display a warning before collection and pass it through server-side redaction before persistence.
- Raw run/assertion/event evidence: retain 90 days.
- Free-form notes: retain 30 days.
- Human triage and issue linkage: retain 365 days.
- Derived aggregate features: retain 365 days only when they contain no note text, randomized names, direct identifiers, or rare high-cardinality values.
- Dataset exports are versioned snapshots with deletion lineage. Deleting a run removes its raw record and excludes it from the next derived snapshot.

Fields eligible for later ML datasets: schema version, level/assertion IDs, semantic fixture flags, normalized error fingerprint, browser/device family, viewport bucket, build distance, duration bucket, outcomes, triage label, replay relationship, and issue linkage. Raw notes require separate review/redaction and are excluded by default.

## Versioning and migration

Patch versions clarify documentation or tighten validation without changing stored shape. Minor versions add optional fields or enum values; consumers retain but may ignore them. Major versions may change meaning or required fields and require a new schema plus an explicit migration. Raw v1 records remain immutable; migrations create a derived v2 representation with source version and run ID preserved.

## Example outcomes

`test/fixtures/qa-evidence-v1.examples.json` covers:

1. PASS;
2. human FAIL without runtime error;
3. human FAIL with normalized client error;
4. server-correlated failure; and
5. successful replay after a fix.

These examples are contract fixtures, not production records.
