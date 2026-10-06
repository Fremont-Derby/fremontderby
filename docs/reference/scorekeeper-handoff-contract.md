# Scorekeeper claim and handoff contract

## Principle

Teammates may score; captains must not be a single point of failure. At the same time, two people on the same team must never concurrently mutate the same player-match/team-side score history.

## Ownership

Each player match has independent Team A and Team B scoring claims. At most one eligible user holds a side's active claim. Eligibility alone does not grant mutation authority; the active claim does.

The claim governs ordinary rack entry, undo, and confirmation for that side. It does not grant lineup, captain, admin, or opposite-team authority. Operator identity is audited separately from the authoritative side/player score record.

## Claim, takeover, and pass

An eligible active roster member may claim an unclaimed side. Another eligible teammate may request takeover but cannot mutate while the current scorer owns the claim.

The current scorer can Release or Deny. Release transfers immediately; Deny retains ownership. If no response occurs within 15 seconds, Fremont Derby auto-transfers using authoritative server time so a dead/offline device cannot block league night.

A scorer may proactively release/pass control. Reads and mutations may lazily resolve an expired pending transfer atomically; no background worker is required.

## Safety

Claim/takeover/release/deny/timeout and scoring mutations must be concurrency-safe. A stale former owner fails closed after transfer. Simultaneous takeover requests resolve deterministically to one owner. Opposing, inactive, ineligible, ended-roster, or unrelated users cannot claim/request the side.

Refresh/reconnect restores authoritative ownership and pending-request state from the server. A stale device becomes read-only as soon as it learns ownership changed and refreshes authoritative score state.

## UX

The scorecard must make ownership understandable: who is scoring, takeover action, pending countdown, Release/Deny, transfer success, and read-only state after ownership loss. Mobile takeover must not create a modal dead end.

Implementation slices and current acceptance evidence belong on active scorekeeper cards. This document owns the enduring behavioral contract.
