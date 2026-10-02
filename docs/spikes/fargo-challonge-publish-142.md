# Spike #142 — Challonge / public results as FargoRate ingestion path

## Goal
Prove whether finalized Derby player-match results can be published to a public bracket host (Challonge preferred) such that FargoRate could ingest them—without dual-entry into LMS.

## Guardrails
- Publish only real finalized/corrected Derby results.
- Never fabricate matches or scores.
- Do not scrape authenticated Fargo surfaces.
- Derby scoring/standings must not depend on this path.

## Preferred test shape
**Candidate A:** One 2-player Single Elimination Challonge tournament per Derby player-match (or per race).
- Pros: Simple score reporting API; clear 1:1 mapping to Derby `player_matches.id`.
- Cons: Tournament volume; naming conventions for identity matching.

## API sketch (not production)
1. Create tournament (`game_name` / race format metadata in description).
2. Add two participants (Derby display names + Fargo external id when known).
3. Report match score from finalized rack totals.
4. Mark complete; retain Challonge URLs in Derby provenance.

## Success criteria for “proven”
- [ ] Sandbox tournament created via API with API key in env (not committed).
- [ ] Finalized Derby score posted and visible on public Challonge page.
- [ ] Document whether Fargo ops recognizes that host/format (manual confirmation).
- [ ] Decision recorded: proceed to #87 Challonge bridge **or** fall through to #93 LMS eval.

## Current recommendation
Proceed with Candidate A in a **non-production** Challonge account when credentials exist. Until Fargo confirms ingestion, keep #87 blocked on this spike’s explicit decision note.

## Related
#87 reporting bridge · #93 LMS fallback · #89 identities · #84 epic
