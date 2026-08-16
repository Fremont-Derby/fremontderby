# Fargo reporting decision (post #142)

**Selected path:** Challonge Candidate A (2-player SE per Derby player-match) when sandbox credentials exist.

**#87:** Implementation deferred until Challonge API key + one sandbox publish proves public visibility. No LMS dual-entry in the default path.

**#93 LMS:** Explicitly **not selected** as primary. Reopen only if Challonge path is rejected by Fargo ops.

## Path B progress (2026-08-16)

- Client: `src/challongePublish.js` (Candidate A tournament builder + publish flow)
- Admin: `POST /api/admin/challonge/publish-candidate-a` — **dry-run by default**
- Live publish requires `CHALLONGE_API_KEY` **and** `CHALLONGE_LIVE_PUBLISH=1`
- Without credentials, endpoint returns `status: not_configured` with full plan payload

### Operator steps to prove live publish
1. Create a Challonge account (sandbox/non-prod).
2. Generate API key; set Worker secret `CHALLONGE_API_KEY`.
3. Optionally set `CHALLONGE_LIVE_PUBLISH=1` only on JFL/lab.
4. POST finalized match fields to the admin endpoint with `"live": true`.
5. Confirm public URL loads; record on this doc whether Fargo ops recognizes the host.
