# Fuzz / Mythos readiness notes

Edge guards live in `src/requestSanitize.js` and are wired through Worker JSON body parsers.

## What is enforced
- JSON body max size (64 KiB)
- Max object depth and key counts
- Max string length per field
- Reject non-object JSON roots and invalid JSON
- Scrub NULs / control characters on sanitized text helpers
- UUID helper (`requireUuid`) for path/body ids
- Client error mapping strips SQL/schema/stack leakage
- API security headers include CORP / COOP where applicable

## What Mythos should still probe
- Authz (captain vs player vs admin) — expected 401/403
- Business-rule 409s (duplicates, finalized matches)
- Lane auth bypass only on jfl/dru

## Intentionally not "fixed" by fuzz noise
Valid domain errors (e.g. “Only the active captain…”) remain readable.
