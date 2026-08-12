# Fremont Derby page, API, and user-story audit

This document is a **product-owner audit sheet** organized by user-facing page. It connects each page to its intended audience, primary purpose, GitHub user stories, visible/product functions, and the HTTP APIs that support those functions.

Use it to mark things that are **missing**, **on the wrong page**, **duplicated**, **too hidden**, or **no longer wanted**.

This is an audit/reference document, not an API compatibility promise. GitHub issues remain the source of truth for requirements and `docs/product-surface-catalog.md` remains the canonical page-ownership index.

## Snapshot

- Repository: `subiki/fremontderby`
- Main snapshot reviewed: `3234643e2451ac73c6a1d3dffd74446e51782b73`
- Date: 2026-08-11 PT
- Current Worker entry: `src/routerEntry.js` -> `src/router.js` -> delegated `src/index.js`
- Current auth: Google -> Supabase Auth; normal authenticated API calls use the user's browser session.
- Trusted privileged/database operations remain server-side; browser users do not receive the Supabase service-role credential.

### Status legend

- **Shipped** — behavior/API exists on this main snapshot.
- **Partial** — meaningful behavior exists but the linked story still has unfinished acceptance criteria.
- **Planned** — documented GitHub story but the required user-facing behavior/API is not complete.
- **Legacy/compatibility** — route remains reachable but is not the canonical current UI contract.
- **Diagnostic** — operational endpoint, not a normal product page.

## Global page/API rules

1. A function should have **one canonical page home**. Other pages may summarize or deep-link to it.
2. Normal authorized functions should be discoverable within **two deliberate navigation actions** (#239).
3. Shared navigation belongs to `src/appShell.js`; page renderers should not invent competing global navigation.
4. Current mobile quick dock is **Teams / Tonight / Score / Messages / Profile**. Child workflows inherit an owning section rather than adding a dock item for every route.
5. `/scorecard/live` is an intentional focus-mode navigation exception.
6. Admin-only functions must remain server-authorized even if the UI also hides them from normal players.
7. API paths containing UUIDs are internal implementation details. Ordinary users should select human-readable entities in the UI rather than type IDs.
8. Current live scoring uses the **team-owned dual-score API family** (`score-comparison`, `score-racks`, `score-confirm`, `finalize-reconciled`). Older single-scorecard endpoints still exist as compatibility surface and are called out separately.
9. Availability has a known product/API mismatch: the current API is round-ID based while #138 now requires availability/check-in to be authoritative **by calendar date**, with `Unsure` as the default.

---

# Page index

| Page | Audience | One primary purpose | Major stories | State / audit note |
| --- | --- | --- | --- | --- |
| `/` | Public visitor | Understand the league and decide what to do next | #252, #248 | Core intro shipped; practical current-season join information still planned |
| `/rules` | Public/player | Read authoritative league rules | rule stories across #3/#4/etc. | Shipped; should remain reference, not workflow management |
| `/profile` | Player; role-aware admin discovery | Identity, sign-in, own participation/status | #8, #341, #343, #335, #298/#299 | Core shipped; claiming, season/payment card, captain phone remain planned |
| `/teams` | Player/captain/public-safe directory | Find/join/create/manage/recruit around teams | #9, #10, #131, #137, #181, #182, #241, #330, #140, #354 | Large surface; recruiting directory and captain qualification/counts still planned |
| `/schedule` | Public/player/captain | See current/upcoming league night and matchup context | #133, #74 | Current-night view shipped; flexible rescheduling is planned |
| `/availability` | Player/captain | Check in for a league date and review team availability | #13, #138, #273, #317 | Core UI shipped, but dated semantics #138 are not aligned with round-based APIs |
| `/lineup` | Captain | Build and lock the team's blind ordered lineup | #13, #139, #156, #319, #262, #19 | Regular-season core shipped; recovery/mobile work open; postseason also uses this workflow concept |
| `/scorecard` | Player/team scorer | Pick an eligible revealed match to score | #141 | Shipped |
| `/scorecard/live` | Player/team scorer | Operate the live team-owned rack ledger | #14, #73, #196, #321-#326, #344, #346 | Current dual-scoring/rack-ledger model shipped substantially; human/War Games proof remains |
| `/messages` | Player/captain | League/team/matchup/direct communication | #76-#80, #281 | Core shipped |
| `/messages/moderation` | Admin/moderator | Review and resolve reported messages | #80 | Shipped, intentionally restricted |
| `/standings` | Public/player | View team + individual season results | #16, #17, #180 | Current standings shipped; historical season selector remains open |
| `/trades` | Player/captain/admin exception | Manage trade proposals/consent/approvals | #11, #71 | Core trade workflow shipped |
| `/prizes` | Public + admin | View purse/payout state; privileged configuration where authorized | #18 | Shared public/admin surface; worth auditing for overload |
| `/season-setup` | League admin | Create/configure/publish/manage season lifecycle | #12, #128, #337, #338 | Core setup shipped; close/readiness/date-policy work open |
| `/admin/season-teams` | League admin | Add eligible team identities into the selected season | #336, #342 | Added by #345; **not yet reconciled into the main product catalog/README** |
| `/admin/operations` | League admin | See readiness/exceptions and next actions | #169, #168, #70, #172-#176, #204 | Partial but useful; broad metrics/freshness work remains |
| `/admin/players` | League admin | Privileged player-level administration | #316, #340, #92, #121, #335 | Role/eligibility/roster exceptions shipped; manual player creation and other admin detail work open |
| `/demo` | Public/tester | **Test Drive the App** with fictional data | #113, #249 | Functional; navigation/page naming still needs reconciliation |
| `/sandbox/captain` | Tester/captain | Practice team formation/availability/lineup safely | #113, #263 | Shipped core practice |
| `/sandbox/player` | Tester/player | Practice scoring/reconciliation safely | #113, #326 | Shipped core; rack-ledger parity/final QA tracked under #326 |
| `/health` | Internal/release | Report deployed Worker/version health | #245, #280 | Diagnostic only |
| `/health/environment` | Internal/release/admin health | Prove environment/project readiness | #35, #149, #175, #245, #280 | Diagnostic only |
| Unknown route / 404 | Any visitor | Recover from a stale/bad URL | #134 | Shipped branded recovery |

---

# `/` — Home

**Audience:** public visitor, prospective player.

**Primary purpose:** explain Fremont Derby and give the visitor the correct next action. Do not turn Home into team administration, scoring, or an admin dashboard.

## User stories

- **#252 — Make the homepage answer when, where, cost, availability, and how to join.** **Planned.** Current/next season, league night, venue policy, first round, registration deadline, price, capacity, and a state-aware join action should be understandable quickly.
- **#248 — Public search/sharing metadata and crawlable season information.** **Planned.** SEO/social metadata belongs to public routes, especially Home.
- **#101 — Fremont Derby favicon and branded public shell.** **Shipped.** Shared identity/branding belongs here and across the shell.
- **#133 — Persistent navigation.** **Shipped.** Home participates in the shared shell.

## Supporting APIs

Home currently has no dedicated page-owned JSON endpoint. Public season facts that Home may consume without inventing a second source of truth already exist through:

- `GET /api/seasons` — public seasons.
- `GET /api/seasons/:seasonId/schedule` — published schedule/date context.
- `GET /api/seasons/:seasonId/prizes` — public purse/prize summary.

**Audit question:** should Home consume the same registration/capacity read model used by Teams/Season Setup instead of assembling practical join state from several endpoints? #252 explicitly says yes.

---

# `/rules` — Rules

**Audience:** public visitor, player, captain.

**Primary purpose:** read the authoritative human-facing rules. Rules should explain decisions; workflow controls should remain on their owning pages.

## User stories/rules represented here

This page is the presentation home for many domain decisions rather than the implementation home of each story. Key rule stories that should remain accurately reflected include:

- **#6** — 8-team / 7-round fair round robin.
- **#7** — handicap/race and mixed 8/9 state.
- **#10** — free agents/subs, seven-match season cap, no same-team double play.
- **#13/#139** — three active regular-season players and blind ordered lineups.
- **#19** — four-player postseason and anchor tiebreaker.
- **#73/#196** — team-owned dual scoring and explicit scoring-team context.
- **#137** — no fixed roster-size cap.
- **#195** — multi-team roster membership.
- **#202** — a person may appear only once in a team matchup and chooses represented team when dual-rostered across opponents.

## Supporting APIs

None are required for the core static/reference purpose. If rules become season-versioned, use a public season/rules read model rather than mixing mutations into this page.

---

# `/profile` — Profile / identity

**Audience:** signed-out visitor becoming a player; signed-in player; authorized admin only for discovery links.

**Primary purpose:** establish/manage **my identity and my own participation state**. Admin tools may be discovered here based on role, but privileged player mutation belongs on `/admin/players`.

## User stories

- **#8 — Sign in and manage a player profile.** **Shipped core.** Google-only identity; own display/profile state.
- **#298/#299 — Truthful signed-out/empty state and phone-safe history.** **Shipped through Profile UX work.** No technical player ID in normal UI.
- **#341 — Claim an unclaimed player with zero racks played.** **Planned.** If a signed-in user has no owned player record, offer claimable unowned zero-rack identities before encouraging duplicate profile creation.
- **#343 — Make season application and payment status obvious.** **Planned.** Player should answer “Am I registered?” and “Have I paid?” within one normal navigation action. Story permits Profile and/or Teams; product owner should audit whether one must be canonical.
- **#335 — Require private captain phone contact.** **Planned.** A captain edits/provides their own private contact information here or an equally clear captain setup flow; broad player directories must not expose it.
- **#239 — Role-aware admin discovery.** **Partial contract.** Authorized admins currently discover Operations, Players, Season Setup, and Moderation here.

## Current APIs

- `GET /api/me/profile` — return own profile.
- `PUT /api/me/profile` — update allowed own profile fields; current handler supports display name.

### Planned/missing API needs

No completed endpoint yet clearly owns:

- self-service unclaimed-player candidate search and claim mutation (#341);
- own current-season registration/payment summary and join-season mutation in the simplified #343 experience;
- own captain phone/contact save under #335.

Those should not be implemented by exposing admin APIs to normal players.

## Audit flags

- **Canonical ambiguity:** #343 currently says Profile and/or Teams. Decide whether registration/payment status has one canonical page and one secondary summary, rather than two equal mutation surfaces.
- `/admin/season-teams` is currently reached through Season Setup, not directly in Profile's role-aware admin group. See its page section and #239 audit flag.

---

# `/teams` — Teams, rosters, recruiting, player directory

**Audience:** public-safe league browser; signed-in player; captain.

**Primary purpose:** understand teams/players and manage **normal** team/roster/recruiting relationships. Privileged exceptions belong under admin surfaces.

## User stories

- **#9 — Create a team, invite players, manage roster.** **Shipped core, but its old four-player cap criterion was superseded.**
- **#137 — Remove roster-size cap / deep rosters.** **Shipped.** Team rosters may exceed four; weekly lineup remains separate.
- **#10 — Join as free agent/sub.** **Shipped core / ongoing eligibility context.**
- **#131 — League teams and player directory page.** **Shipped core.** One player entry may list multiple current teams; no private contact/payment/auth data.
- **#181 — Player requests team membership; captain approves.** **Shipped core.** Multi-team membership is valid.
- **#195 — Multi-team roster membership.** **Shipped.** One team join must not silently remove another membership/captaincy.
- **#182 — Captain lifecycle.** **Planned/partial.** Transfer captaincy, step down, leave, dissolve/withdraw safely.
- **#241 — Action-first league-night Teams hub.** **Shipped.** Links to availability, lineup, scoring, chat, roster/trades.
- **#330 — Sortable/filterable player directory for recruiting and substitutes.** **Planned.** Search/sort by player/team; filter team, no-team/free-agent, and dated Available/Unsure/Unavailable; fast “Available to sub”.
- **#140 — Postseason qualification progress.** **Planned.** Captain needs concise roster progress and qualification targets.
- **#354 — Show team-specific and cross-team match counts.** **Planned.** `4 for us · 2 elsewhere` plus concise eligibility cue; detailed evidence collapsed.
- **#343/#120 — Player season registration/payment entry.** **Planned/ambiguous supporting placement.** Team membership is not required for season registration.
- **#132 — Team capacity/returning slots/application readiness.** Foundational season-team capacity story; some counters/visibility belong here, while season assignment itself belongs to admin season management.

## Current APIs — normal team management

- `GET /api/me/teams` — own team-management context.
- `GET /api/me/team-membership-requests` — own membership requests.
- `POST /api/teams/:teamId/membership-request` — request team membership.
- `POST /api/team-membership-requests/:requestId/respond` — captain approve/decline.
- `POST /api/team-membership-requests/:requestId/cancel` — requester cancels.
- `POST /api/teams/:teamId/invitations` — captain invites player.
- `POST /api/team-invitations/:invitationId/respond` — invited player accepts/declines.
- `POST /api/team-invitations/:invitationId/cancel` — cancel invitation.
- `POST /api/team-memberships/:membershipId/remove` — remove/end target membership under normal rules.

## Current APIs — season/team application and free-agent participation

- `POST /api/seasons/:seasonId/teams` — current trusted team-entry/application path.
- `GET /api/seasons/:seasonId/team-registration/me` — own team-registration state.
- `POST /api/seasons/:seasonId/team-applications` — submit team application.
- `POST /api/team-applications/:applicationId/withdraw` — withdraw application.
- `POST /api/team-slots/:slotId/respond` — returning-team slot response.
- `POST /api/seasons/:seasonId/free-agents/me` — register self as free agent.

## Current APIs — representation choice

These matter when a player belongs to both teams in the same matchup:

- `GET /api/me/team-match-choices` — choices requiring/reflecting represented-team selection.
- `PUT /api/team-matches/:teamMatchId/team-choice/me` — choose represented team.

## Planned/missing APIs

- #330's league-wide searchable/sortable/filterable recruiting directory does not yet have a clearly named dedicated public/player read endpoint. Reuse safe directory read models; do not expose `/api/admin/players`.
- #140/#354 need team-specific official match-count/qualification read data and captain target-mark mutations; no canonical API is documented here yet.
- #182 captain lifecycle needs explicit mutation contracts rather than overloading generic membership removal.

## Audit flags

- This is one of the largest pages. Confirm that “team directory + player directory + normal roster operations + recruiting” still feels like one coherent purpose rather than separate equal applications.
- Keep normal recruiting here. Do **not** move #330 to `/admin/players` merely because both pages list players.

---

# `/schedule` — Tonight / schedule

**Audience:** public visitor, player, captain.

**Primary purpose:** see the relevant league night/matchup context and enter the next workflow.

## User stories

- **#133 — Persistent navigation + Tonight schedule.** **Shipped.** Current/active postseason is prioritized; matchup cards expose Score/Messages.
- **#74 — Flexible matchup scheduling, venues, out-of-order play.** **Planned.** Captains should be able to propose/accept alternate date/time/venue while preserving scheduled-round identity.
- **#128 — Holiday/blackout season date generation.** Display consequence belongs here, but configuration/generation belongs to Season Setup.

## Current APIs

- `GET /api/seasons` — season choices.
- `GET /api/seasons/:seasonId/schedule` — public scheduled rounds/matchups.

## Planned/missing APIs

#74 requires explicit captain proposal/acceptance/read models for alternate date/time/venue. No page-owned rescheduling API is currently documented in the main route set.

---

# `/availability` — Dated check-in

**Audience:** player and captain.

**Primary purpose:** a player marks their own check-in state; captains review roster/free-agent state for the selected league date.

## User stories

- **#13 — Availability as part of weekly lineup workflow.** Core shipped.
- **#138 — Dated Available / Unavailable / Unsure check-in and substitute discovery.** **Planned semantics change.** Availability is by calendar date; `Unsure` is default; missing response is not Unavailable.
- **#273 — Compact accessible three-state phone control.** UX story, shipped/reconciled through later Availability work.
- **#317 — Truthful first render/recovery.** **Shipped.**

## Current APIs

- `PUT /api/rounds/:roundId/availability/me` — set own roster availability for a round.
- `PUT /api/rounds/:roundId/free-agent-availability/me` — set own free-agent availability for a round.
- `GET /api/teams/:teamId/rounds/:roundId/availability` — authorized team/round availability view.
- `GET /api/teams/:teamId/rounds/:roundId/eligible-free-agents` — eligible free agents for team/round.

## Critical audit mismatch

**The current API keys availability by `roundId`; the current product decision in #138 keys check-in by calendar date.** This must be reconciled in the feature/data lane. Do not create a second parallel “date availability” system while leaving round availability authoritative.

Questions for audit:

- Is the date the actual agreed play date or default league-night date?
- If a team matchup is rescheduled, does a date check-in apply to every matchup a player might play that date, or can one player have matchup-specific intent?
- How should the seven-match cap and same-team double-play rule surface when someone marks themselves Available for multiple opportunities on one date?

---

# `/lineup` — Captain lineup

**Audience:** captain.

**Primary purpose:** choose and lock the team's active lineup for a specific matchup. Discovery may be supported by Teams/Availability, but lineup commitment belongs here.

## User stories

- **#13 — Submit three active regular-season players.** Core shipped.
- **#139 — Seal three-player order until both captains commit.** **Shipped.**
- **#156 — Build lineup from human-readable current matchup without IDs/tokens.** **Shipped.**
- **#138 — Fast substitute discovery.** **Partial/planned dated semantics.** Available roster/free agents should sort usefully and blockers should be understandable.
- **#262 — Keep selected lineup visible while choosing on mobile.** UX follow-up.
- **#319 — Truthful first-render/recovery states.** **Open.**
- **#202 — One person cannot appear twice in the team matchup; dual-rostered player chooses represented side first.** **Shipped rule.**
- **#19 — Four-player postseason lineup + predeclared anchor.** **Open overall postseason story.** Lineup interaction should remain conceptually here rather than creating a competing lineup page.

## Current APIs

- `GET /api/teams/:teamId/rounds/:roundId/availability` — roster availability input.
- `GET /api/teams/:teamId/rounds/:roundId/eligible-free-agents` — substitute input.
- `GET /api/teams/:teamId/rounds/:roundId/lineup` — read visible lineup state under blind/reveal rules.
- `POST /api/teams/:teamId/rounds/:roundId/lineup` — submit regular-season lineup.
- `GET /api/me/team-match-choices` — dual-roster representation state.
- `PUT /api/team-matches/:teamMatchId/team-choice/me` — player chooses represented side.
- `POST /api/team-matches/:teamMatchId/postseason-lineup` — submit postseason lineup.

## Audit flags

- Regular-season API remains round-addressed. With #74 flexible scheduling and #138 dated availability, verify a captain can always identify the intended team matchup without relying on “current round” assumptions.
- Keep substitute *discovery* reusable, but final eligibility/commit should remain authoritative here/server-side.

---

# `/scorecard` — Match picker

**Audience:** signed-in player or eligible teammate scorer.

**Primary purpose:** find a revealed player match the user's team is authorized to score, then enter live scoring.

## User stories

- **#141 — Replace token/Match-ID entry with eligible match picker.** **Shipped.**
- **#250 scorecard recovery slice.** **Shipped.** Signed-out/no-ready-match/session/load states provide useful next actions.
- **#196 — Explicit scoring-team context for multi-team members.** Selection/handoff into live score needs this when membership is ambiguous.

## Current APIs

- `GET /api/me/scorable-matches` — list human-readable scorable matches authorized for the signed-in user's team membership(s).
- `GET /api/me/team-match-choices` / `PUT /api/team-matches/:id/team-choice/me` — representation choice where relevant.

## Audit question

Does Score need a date/calendar selector consistent with #138/#74, or should Schedule be the canonical date selection and Score simply show all currently actionable matches? Avoid two equally powerful “find a match by date” concepts unless intentionally designed.

---

# `/scorecard/live` — Live rack-ledger scoring

**Audience:** authenticated member of either participating team who is authorized to operate that team's score history.

**Primary purpose:** enter, compare, reconcile, confirm, and finalize the active player match without editing the opposing team's history.

## User stories

- **#14 — Score a live 8/9 race from a phone.** **Shipped core.**
- **#73 — Dual team-owned rack histories and dual confirmation.** **Shipped core.** Same-team members may score for each other; opponent history is read-only.
- **#196 — Explicit scoring-team context for multi-team scorers.** **Shipped.**
- **#321 — Rack-ledger scoring epic.** **Partial/final QA.** Canonical hierarchy: running team score -> individual race -> rack ledger -> mismatch -> direct rack edit.
- **#322 — Shared 8-first / 9-first choice.** **Shipped.** R1-R3 use opening discipline; R4+ use other discipline.
- **#323 — Rebuild around rack ledger.** **Shipped implementation; issue state should be audited/reconciled.**
- **#324 — Edit one earlier rack without undoing later racks.** **Shipped.**
- **#325 — Exact rack mismatch/pending state.** **Shipped**, including the latest pending-rack recovery on this snapshot.
- **#344 — Collision-safe same-team multi-device scoring.** **Shipped via #355.** Stale clients conflict/refresh instead of producing phantom racks or overwriting newer edits.
- **#326 — Two-phone / War Games / human proof.** **Partial.** Deterministic multi-device proof shipped via #356; physical two-human and War Games parity still remain.
- **#346 — Optional one-scorekeeper lock/takeover model.** **Optional/planned fallback only.** Do not treat as current default while #344 collaborative model is preferred.
- **#15 — Correct a finalized result with audit.** Normal scorer edits stop at finalization; admin correction stays privileged.

## Current canonical dual-scoring APIs

- `GET /api/player-matches/:playerMatchId/score-comparison`
  - reads both team-owned submissions and reconciliation/live context;
  - current same-team collision model also stamps the caller's viewed team history for checked writes.
- `POST /api/player-matches/:playerMatchId/score-racks`
  - append next rack when sent winner/team context;
  - set opening discipline before rack 1;
  - surgical existing-rack edit when `rackNumber` is supplied;
  - collision-safe normal Worker path rejects stale expected history.
- `POST /api/player-matches/:playerMatchId/score-racks/undo`
  - own-team undo subject to team authorization/stale-state contract.
- `POST /api/player-matches/:playerMatchId/score-confirm`
  - own team confirms reconciled history; stale confirmation protection applies where relevant.
- `POST /api/player-matches/:playerMatchId/finalize-reconciled`
  - finalize only when histories reconcile and both required confirmations exist.
- `POST /api/admin/player-matches/:playerMatchId/finalize-override`
  - privileged dispute override; admin-only and audited.

## Legacy/compatibility scoring API family

These older routes still exist in `src/index.js` and should be audited for retirement/explicit compatibility ownership. They are **not the canonical live UI contract**:

- `GET /api/player-matches/:playerMatchId/scorecard`
- `POST /api/player-matches/:playerMatchId/racks`
- `POST /api/player-matches/:playerMatchId/racks/undo`
- `POST /api/player-matches/:playerMatchId/finalize`
- `POST /api/player-matches/:playerMatchId/correct`

## Audit flags

- Two API families represent scoring. Confirm whether the legacy family is still required by any real client/test or can be explicitly deprecated.
- #323 remains open in GitHub despite the implementation being merged; backlog state should be reconciled against #321/#326.
- `/scorecard/live` deliberately receives reduced navigation; it must always provide an obvious exit/back-to-Score path.

---

# `/messages` — Communication home

**Audience:** signed-in players and captains.

**Primary purpose:** coordinate league, team, matchup, and direct communication without publishing personal contact information.

## User stories

- **#76 — Self-service league communication epic.** Core communication umbrella.
- **#77 — Direct player messaging without exposing contact details.** Core shipped.
- **#78 — Team chat + matchup coordination threads.** Core shipped.
- **#79 — Season-wide league chat.** Core shipped.
- **#80 — Blocking/reporting/moderation controls.** Player-side controls here; admin resolution on Moderation page.
- **#281 — Task-oriented signed-out/empty/failure states.** **Shipped through #285.**
- **#335 — Captain phone contact does NOT belong here as a public contact directory.** In-app messaging remains normal player-to-player coordination.

## Current discovery/notification APIs

- `GET /api/me/chat-threads`
- `GET /api/me/message-notification-summary`
- `GET /api/me/league-chat-threads`
- `GET /api/me/matchup-chat-threads`
- `GET /api/me/direct-message-inbox`
- `GET /api/me/direct-message-candidates`
- `GET /api/me/blocked-players`

## Current direct-message APIs

- `POST /api/direct-conversations`
- `GET /api/direct-conversations/:conversationId/messages`
- `POST /api/direct-conversations/:conversationId/messages`
- `POST /api/direct-conversations/:conversationId/messages/read`
- `POST /api/players/:playerId/block`
- `DELETE /api/players/:playerId/block`

## Current team-chat APIs

- `GET /api/teams/:teamId/messages`
- `POST /api/teams/:teamId/messages`
- `POST /api/teams/:teamId/messages/read`

## Current matchup-chat APIs

- `GET /api/team-matches/:teamMatchId/messages`
- `POST /api/team-matches/:teamMatchId/messages`
- `POST /api/team-matches/:teamMatchId/messages/read`

## Current league-chat APIs

- `GET /api/seasons/:seasonId/messages`
- `POST /api/seasons/:seasonId/messages`
- `POST /api/seasons/:seasonId/messages/read`

## Reporting API

- `POST /api/chat-reports` — report a specific message with allowed context.

## Audit question

#74 wants alternate matchup scheduling to be coordinated between captains. Decide whether Messages merely links to the canonical scheduling proposal state or whether matchup chat itself owns date/venue proposal actions. Avoid hiding actual scheduling state only in free-text chat.

---

# `/messages/moderation` — Moderation

**Audience:** moderator / league admin.

**Primary purpose:** inspect and resolve **reported** message content under the moderation policy. It is not a general message-reading/admin surveillance page.

## User stories

- **#80 — Blocking, reporting, simple moderation.** Admin portion lives here.
- **#176 — Communication engagement without exposing private messages.** Counts/analytics belong in Operations, not Moderation; reported message context is the exception.

## Current APIs

- `GET /api/admin/chat-reports` — moderation queue.
- `POST /api/admin/chat-reports/:reportId/resolve` — resolve/moderate report.

---

# `/standings` — Team and individual standings

**Audience:** public visitor and player.

**Primary purpose:** show derived competitive results for a selected season.

## User stories

- **#16 — Calculate/display team standings.** **Open story, core display exists.** Regular season is win/loss only.
- **#17 — Individual standings across missed weeks/team changes.** **Shipped core.** Results stay attached to player.
- **#180 — Select/view any season.** **Planned.** Current/historical season dropdown with shareable state.
- **#19 — postseason result/advancement affects standings/history**, but postseason operation itself does not belong on this public page.

## Current APIs

- `GET /api/seasons` — public season list.
- `GET /api/seasons/:seasonId/team-standings` — team standings.
- `GET /api/seasons/:seasonId/individual-standings` — individual standings.

## Audit flags

- #16 remains open while a team standings read exists. Verify whether its remaining criteria are implementation gaps, proof gaps, or stale issue state.
- Qualification planning (#140/#354) should not turn public Standings into a captain roster-planning page.

---

# `/trades` — Trades

**Audience:** player, captain; admin only for explicit exception path.

**Primary purpose:** manage a consensual trade lifecycle while preserving history.

## User stories

- **#11 — Trade players before roster lock.** **Shipped core.** Player consent + both captain approvals; historical results preserved.
- **#71 — Preserve membership/transfer history.** Broader admin/audit requirement; normal trade interaction stays here.

## Current APIs

- `GET /api/me/trades` — user's relevant trade state.
- `POST /api/teams/:teamId/trades` — propose team trade.
- `POST /api/team-trades/:tradeId/player-response` — moved player response.
- `POST /api/team-trades/:tradeId/captain-approval` — captain approval.
- `POST /api/admin/teams/:teamId/trades` — privileged admin trade exception.

## Audit question

Should exceptional admin trade action remain an API reachable from this page under role-aware controls, or should all privileged roster exceptions consolidate under `/admin/players`? The product catalog currently says `/trades` includes an admin exception audience, while `/admin/players` now owns general exact roster exceptions.

---

# `/prizes` — Prize pool / payout state

**Audience:** public player; authorized league admin for configuration/finalization.

**Primary purpose today:** shared public visibility plus privileged configuration. This is the clearest currently documented page-overload candidate.

## User stories

- **#18 — Publish season prize pool/payout configuration.** Public transparency + admin configuration.
- **#119/#121/#343 — individual payment status is separate.** Do not expose player-by-player payment state here.

## Current APIs

Public:

- `GET /api/seasons/:seasonId/prizes`

Admin:

- `POST /api/admin/seasons/:seasonId/prizes` — configure season prizes.
- `POST /api/admin/seasons/:seasonId/prizes/finalize` — finalize payouts.

## Audit flag

Decide whether public purse visibility and admin payout administration truly belong on one route with role-separated controls, or whether admin prize configuration belongs inside Season Management while `/prizes` remains public/read-only.

---

# `/season-setup` — Season management / publishing

**Audience:** league admin/director.

**Primary purpose:** configure the selected season and manage its lifecycle. Team assignment may be a child workflow; player administration does not belong here.

## User stories

- **#12 — Create a season and publish seven-round schedule.** **Shipped core.**
- **#155 — Human-readable setup without IDs/tokens.** **Shipped.**
- **#132 — team capacity, returning reservations, applications, waitlist/readiness.** Foundational management behavior; much is implemented in registration infrastructure.
- **#128 — Holiday/blackout date generation.** **Planned.** Preview/skip/override policy belongs here.
- **#336 — Add eligible teams to selected season.** **Shipped as child page `/admin/season-teams`.**
- **#337 — Close completed season without destroying history.** **Planned P0.**
- **#338 — Publish/Close readiness checklist.** **Planned.** Links to canonical pages for fixes rather than duplicating mutations.
- **#315 — Admin league control center.** Parent administration epic.

## Current APIs — season setup

- `GET /api/admin/seasons` — list seasons for admin setup.
- `POST /api/admin/seasons` — create season setup.
- `GET /api/admin/seasons/:seasonId/setup`
- `PUT /api/admin/seasons/:seasonId/setup`
- `POST /api/admin/seasons/:seasonId/publish-schedule`

## Current APIs — registration/team-slot setup

- `GET /api/admin/seasons/:seasonId/team-registration`
- `PUT /api/admin/seasons/:seasonId/team-registration`
- `POST /api/admin/seasons/:seasonId/team-slots/seed`
- `POST /api/admin/team-applications/:applicationId/respond`
- `POST /api/admin/team-slots/:slotId/manage`

## Current postseason admin APIs related to season lifecycle

- `POST /api/admin/seasons/:seasonId/start-playoffs`
- `POST /api/admin/seasons/:seasonId/advance-championship`

## Current composition behavior

`src/routerEntry.js` currently modifies the rendered `/season-setup` HTML after the legacy router returns it, injecting a **Manage season teams** link before `</main>`.

## Planned/missing APIs

- Close/cancel/archive/safe-delete season lifecycle (#337) is not represented by a completed clear endpoint family here.
- Publish/close readiness summary (#338) needs a read model or reuse of authoritative readiness data.
- Holiday/blackout rules and preview/regeneration (#128) need explicit API/domain support.

## Audit flags

- The HTML-injection wrapper is a pragmatic implementation but creates a composition path outside the page renderer/shared navigation. Audit whether this should become a first-class Season Setup control.
- `/admin/season-teams` may currently take **three actions from shared nav**: Profile -> Season Setup -> Manage season teams, depending on how #239 counts the role-aware entry. If so, it violates the <=2 rule.

---

# `/admin/season-teams` — Add teams to a season

**Audience:** league admin/director.

**Primary purpose:** populate one selected season's team slots from eligible team identities, distinguishing Returning / New / In season.

## User stories

- **#336 — Add teams to a season with Returning / New / In season views.** **Shipped first slice via PR #345.** Historical returning rows are not moved; a target-season team instance is created/linked appropriately.
- **#342 — Manually create teams from League Management.** **Planned.** Provides durable pre-season/new-team records that feed the **New** view.
- **#335 — captain phone readiness.** Candidate context may show `Contact on file` / `Phone missing`, but broad lists should not expose phone numbers.
- **#315 — Admin control center parent.** Team/season admin workflows should remain discoverable/coherent.

## Current APIs

- `GET /api/admin/seasons/:seasonId/team-candidates` — classify/list candidates and capacity context.
- `POST /api/admin/seasons/:seasonId/teams/:teamId/add` — add selected eligible team to season.

## Current discoverability

- Route is handled by `src/adminSeasonTeamsRouter.js` before the legacy router.
- `/season-setup` gets an injected **Manage season teams** link through `src/routerEntry.js`.

## Important documentation/IA gaps

- This route is current `main` but was introduced after the last main `docs/product-surface-catalog.md` reconciliation.
- PR #345 added a sidecar `docs/product-surface-catalog-season-teams.md` instead of updating the canonical catalog directly.
- README's main user-surface list does not yet include `/admin/season-teams`.
- The route is not currently listed in `APP_PAGE_PATHS` inside the legacy `appShell.js`; it receives the shell because its separate router explicitly decorates it.
- Audit whether season-team assignment is truly a separate page or should be a Season Setup tab/section. If separate, fix its <=2-action admin discovery and canonical docs.

---

# `/admin/operations` — Operations / league-night triage

**Audience:** league admin/director.

**Primary purpose:** answer **“what needs attention?”** using read-only/aggregate operational evidence, then link to the page that owns the fix.

## User stories

- **#169 — Admin operations overview/action queue.** **Partial/shipped.** Current signals include availability, lineup-deadline risk, score mismatch aging, started-unfinalized aging, and selected-player payment eligibility. Remaining: missing handicap seed, oldest report age, rating freshness policy, complete fixtures.
- **#168 — Admin operations/engagement cockpit epic.** Parent.
- **#70 — League-health dashboard/exception metrics.** Older/broader story; should be reconciled to avoid duplicating #169/#168.
- **#172 — Feature friction/contextual feedback.** **Planned.**
- **#173 — Privacy-safe access/workflow telemetry.** **Planned.**
- **#174 — Fargo freshness/change monitoring.** **Planned.**
- **#175 — Environment/migration/canary health.** **Planned.**
- **#176 — Communication engagement counts without message bodies.** **Planned.**
- **#204 — Recommendations as action cards.** Product presentation rule for Operations recommendations.

## Current API

- `GET /api/admin/operations` — league-admin authorized operational overview/action queue.

## Audit rule

Operations may say “3 lineups missing” or “1 scoring mismatch needs attention” and deep-link to Lineup/Score/Admin Players/etc. It should not grow duplicate editing forms for every other page.

---

# `/admin/players` — Privileged player management

**Audience:** league admin/director only.

**Primary purpose:** find a person and make **privileged player-level league administration** changes. Normal player discovery/recruiting belongs on Teams.

## User stories

- **#316 — Roles, competition eligibility, roster exceptions.** **Implementation shipped; human phone validation remains.**
- **#340 — Manually create unclaimed player records before signup.** **Planned P0.**
- **#92 — Rating evidence and external identity review tools.** **Planned future player-admin detail.**
- **#121 — Admin registration roster and paid/unpaid tracking.** **Planned.** Likely player-admin/season-admin concern; audit canonical placement.
- **#335 — View captain private phone contact for league operations.** **Planned.** Broad list should show readiness, details may reveal number to admin.
- **#71/#72 — membership/history and player dispute timeline.** **Planned broader admin/audit capabilities.** Could become player detail inside this surface rather than another duplicate player-admin page.
- **#330 explicitly does NOT belong here.** Normal recruiting/substitute directory remains `/teams`.

## Current APIs

- `GET /api/admin/players` — admin player list plus roster-team choices.
- `PUT /api/admin/players/:playerId/admin-role` — **multiplexed privileged mutation endpoint**:
  - default body `{ enabled, reason? }` -> grant/revoke league admin;
  - body `{ operation: "competition-eligibility", seasonId, eligible, reason? }` -> eligibility restriction/restore;
  - body `{ operation: "roster-membership", seasonId, teamId, active, reason? }` -> exact roster add/remove exception.

## Planned/missing APIs

- Create unclaimed player (#340).
- Admin captain-contact read/update boundary (#335).
- Registration/payment roster mutations (#121) if not already exposed elsewhere under a different internal endpoint.
- Rating/identity review actions (#92).

## Audit flags

- One URL named `/admin-role` currently multiplexes **three unrelated operations**. It works, but the API naming no longer matches its responsibility. Audit whether to split into explicit endpoints for maintainability/audit clarity.
- Decide whether payment tracking and captain contacts are player detail here, season management, or Operations-linked detail. Avoid three admin pages each owning a different editable fragment of the same person without a clear reason.

---

# `/demo` — Test Drive the App

**Audience:** public visitor/tester.

**Primary purpose:** safely understand the product using deterministic fictional/non-authoritative data.

## User stories

- **#113 — Demo season + sandbox practice mode.** Core demo/test framework.
- **#249 — Present War Games as a guided public test drive.** **Partial.** Product-owner decision: canonical shared-navigation/page identity should be **Test Drive the App**; `Try a League Night` may remain supporting copy.
- **#172 — contextual feedback.** Planned feedback lane used by the test drive rather than inventing a separate feedback system.

## APIs

The public demo entry is rendered as isolated fictional/test-drive behavior rather than using production competitive mutation endpoints. Release automation also uses `GET /demo` as a smoke surface.

## Audit flags

- Shared nav historically said `Demo`; #249 now requires **Test Drive the App** consistently.
- Ensure any reset/fixture controls remain secondary/tester-oriented and cannot mutate production records.

---

# `/sandbox/captain` — Captain practice

**Audience:** tester/captain.

**Primary purpose:** practice team formation, roster churn, availability, and lineup without competitive writes.

## User stories

- **#113 — sandbox captain practice.**
- **#263 — team formation and roster churn War Games.** **Shipped core.**
- **#138** dated check-in behavior should eventually be mirrored here if the sandbox is meant to teach the real availability model.

## APIs

Intentionally uses deterministic isolated/browser/session practice state rather than normal production team/lineup mutation APIs.

---

# `/sandbox/player` — Player/scoring practice

**Audience:** tester/player.

**Primary purpose:** practice team-owned scoring, mismatch, correction, confirmation, and finalization safely.

## User stories

- **#113 — player sandbox practice.**
- **#326 — War Games parity with the real rack-ledger/two-team flow.** **Still part of final scoring QA.**
- Current scoring stories #321-#325/#344 define the interaction model the sandbox should teach, but the sandbox must remain isolated from competitive records.

## APIs

Intentionally does not use competitive production write endpoints against real season records.

---

# `/health` — Release health

**Audience:** internal/release automation. Not normal navigation.

**Primary purpose:** prove the Worker version serving the hostname.

## Stories/issues

- **#245 — traceable production releases.**
- **#280 — current Cloudflare 403 production smoke blocker.**

## Endpoint

- `GET /health` -> health/version JSON, including version/build metadata used by release smoke.

---

# `/health/environment` — Environment readiness

**Audience:** internal/release automation; summarized for admin only where safe.

**Primary purpose:** prove environment identity/bindings/readiness without exposing secrets.

## Stories/issues

- **#35 — staging/production project isolation proof.**
- **#149 — scheduled Supabase keep-alive/environment canary.**
- **#175 — surface environment/migration/canary health in Operations.**
- **#245/#280 — release proof.**

## Endpoint

- `GET /health/environment` -> non-secret environment/project/readiness JSON; returns failure status if readiness is not satisfied.

---

# Unknown route / 404

**Audience:** any visitor.

**Primary purpose:** recover from a bad/stale URL.

## User story

- **#134 — Branded basset hound 404.** **Shipped.** Home is primary recovery; Teams/Schedule/Standings are useful secondary recovery paths.

No product mutation API is owned here.

---

# API ownership reference by domain

This section is intentionally redundant with the page sections so an API can be found without knowing its page first.

## Public/read APIs

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/seasons` | Home/Schedule/Standings/public season selection |
| GET | `/api/seasons/:seasonId/schedule` | Schedule |
| GET | `/api/seasons/:seasonId/team-standings` | Standings |
| GET | `/api/seasons/:seasonId/individual-standings` | Standings |
| GET | `/api/seasons/:seasonId/prizes` | Prizes/Home supporting summary |

## Own profile / identity

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/me/profile` | Profile |
| PUT | `/api/me/profile` | Profile |

## Teams / registration / roster

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/me/teams` | Teams |
| GET | `/api/me/team-membership-requests` | Teams |
| POST | `/api/seasons/:seasonId/teams` | Teams team-entry/application |
| GET | `/api/seasons/:seasonId/team-registration/me` | Teams/Profile supporting state |
| POST | `/api/seasons/:seasonId/team-applications` | Teams |
| POST | `/api/team-applications/:applicationId/withdraw` | Teams |
| POST | `/api/team-slots/:slotId/respond` | Teams returning-team flow |
| POST | `/api/teams/:teamId/membership-request` | Teams |
| POST | `/api/team-membership-requests/:requestId/respond` | Teams captain workflow |
| POST | `/api/team-membership-requests/:requestId/cancel` | Teams |
| POST | `/api/teams/:teamId/invitations` | Teams captain workflow |
| POST | `/api/team-invitations/:invitationId/respond` | Teams |
| POST | `/api/team-invitations/:invitationId/cancel` | Teams |
| POST | `/api/team-memberships/:membershipId/remove` | Teams normal roster management |
| POST | `/api/seasons/:seasonId/free-agents/me` | Teams/free-agent registration |

## Availability / substitute discovery

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| PUT | `/api/rounds/:roundId/availability/me` | Availability |
| PUT | `/api/rounds/:roundId/free-agent-availability/me` | Availability |
| GET | `/api/teams/:teamId/rounds/:roundId/availability` | Availability/Lineup |
| GET | `/api/teams/:teamId/rounds/:roundId/eligible-free-agents` | Availability/Lineup |

**Known required redesign:** #138 says calendar date, not round, is the authoritative check-in key.

## Team-match representation and lineups

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/me/team-match-choices` | Teams/Lineup/Score supporting player choice |
| PUT | `/api/team-matches/:teamMatchId/team-choice/me` | Player chooses represented side |
| GET | `/api/teams/:teamId/rounds/:roundId/lineup` | Lineup |
| POST | `/api/teams/:teamId/rounds/:roundId/lineup` | Lineup |
| POST | `/api/team-matches/:teamMatchId/postseason-lineup` | Lineup postseason |

## Score selection/live scoring

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/me/scorable-matches` | Score picker |
| GET | `/api/player-matches/:id/score-comparison` | Live Score |
| POST | `/api/player-matches/:id/score-racks` | Live Score append/setup/edit |
| POST | `/api/player-matches/:id/score-racks/undo` | Live Score |
| POST | `/api/player-matches/:id/score-confirm` | Live Score |
| POST | `/api/player-matches/:id/finalize-reconciled` | Live Score |
| POST | `/api/admin/player-matches/:id/finalize-override` | Admin dispute exception linked from scoring/ops |

Legacy/compatibility scoring endpoints: `/scorecard`, `/racks`, `/racks/undo`, `/finalize`, `/correct` under `/api/player-matches/:id/*` as documented in the Live Score section.

## Trades

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/me/trades` | Trades |
| POST | `/api/teams/:teamId/trades` | Trades |
| POST | `/api/team-trades/:tradeId/player-response` | Trades |
| POST | `/api/team-trades/:tradeId/captain-approval` | Trades |
| POST | `/api/admin/teams/:teamId/trades` | Admin trade exception |

## Messaging

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/me/chat-threads` | Messages |
| GET | `/api/me/message-notification-summary` | Shared shell/Messages |
| GET | `/api/me/league-chat-threads` | Messages |
| GET | `/api/me/matchup-chat-threads` | Messages |
| GET | `/api/me/direct-message-inbox` | Messages |
| GET | `/api/me/direct-message-candidates` | Messages |
| GET | `/api/me/blocked-players` | Messages |
| POST | `/api/direct-conversations` | Messages |
| GET/POST | `/api/direct-conversations/:id/messages` | Messages |
| POST | `/api/direct-conversations/:id/messages/read` | Messages |
| POST/DELETE | `/api/players/:id/block` | Messages |
| GET/POST | `/api/teams/:id/messages` | Messages |
| POST | `/api/teams/:id/messages/read` | Messages |
| GET/POST | `/api/team-matches/:id/messages` | Messages |
| POST | `/api/team-matches/:id/messages/read` | Messages |
| GET/POST | `/api/seasons/:id/messages` | Messages |
| POST | `/api/seasons/:id/messages/read` | Messages |
| POST | `/api/chat-reports` | Messages reporting |
| GET | `/api/admin/chat-reports` | Moderation |
| POST | `/api/admin/chat-reports/:id/resolve` | Moderation |

## Season management / postseason

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET/POST | `/api/admin/seasons` | Season Setup |
| GET/PUT | `/api/admin/seasons/:id/setup` | Season Setup |
| POST | `/api/admin/seasons/:id/publish-schedule` | Season Setup |
| GET/PUT | `/api/admin/seasons/:id/team-registration` | Season Setup |
| POST | `/api/admin/seasons/:id/team-slots/seed` | Season Setup |
| POST | `/api/admin/team-applications/:id/respond` | Season Setup/season-team management |
| POST | `/api/admin/team-slots/:id/manage` | Season Setup |
| POST | `/api/admin/seasons/:id/start-playoffs` | Season lifecycle/postseason |
| POST | `/api/admin/seasons/:id/advance-championship` | Season lifecycle/postseason |

## Admin season-team assignment

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/admin/seasons/:id/team-candidates` | Admin Season Teams |
| POST | `/api/admin/seasons/:id/teams/:teamId/add` | Admin Season Teams |

## Prize administration

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| POST | `/api/admin/seasons/:id/prizes` | Prizes or Season Management — **audit placement** |
| POST | `/api/admin/seasons/:id/prizes/finalize` | Prizes or Season Management — **audit placement** |

## Admin operations / players

| Method | Endpoint | Canonical page/use |
| --- | --- | --- |
| GET | `/api/admin/operations` | Operations |
| GET | `/api/admin/players` | Admin Players |
| PUT | `/api/admin/players/:id/admin-role` | Admin Players; currently multiplexes role/eligibility/roster exception |

## Diagnostic

| Method | Endpoint | Use |
| --- | --- | --- |
| GET | `/health` | exact deployed Worker/version proof |
| GET | `/health/environment` | environment/binding/readiness proof |

---

# Product-owner audit flags

These are the places that most clearly deserve a **“yes, this is right” / “move it” / “missing”** decision.

1. **Availability semantic mismatch:** #138 says check-in is by calendar date, but every current availability API is keyed by `roundId`.
2. **New admin season-team page is not fully integrated into canonical IA:** `/admin/season-teams` is current main, but README/main product catalog lag behind it and a sidecar catalog file was introduced.
3. **Season-team discoverability:** current ordinary path is effectively Profile -> Season Setup -> Manage season teams. Audit against #239's <=2-action rule.
4. **Season Setup link injection:** `routerEntry.js` post-processes rendered HTML to add Manage season teams. Decide whether that should become a normal first-class page control/component.
5. **Teams is broad:** team directory, player directory, joining, applications, invites, roster management, recruiting, league-night hub, and future qualification planning all collect here. Confirm this still feels like one understandable “Teams” job.
6. **Profile vs Teams registration ownership:** #343 deliberately says Profile and/or Teams. Pick one canonical mutation home and use the other as a summary/link if possible.
7. **Prizes mixes public and privileged jobs:** public purse transparency and admin payout configuration/finalization currently share one page concept. Confirm or split admin configuration into season management.
8. **Admin Players API name is stale:** `/api/admin/players/:id/admin-role` now mutates admin role, competition eligibility, and roster membership based on an `operation` body discriminator.
9. **Scoring has two API families:** current team-owned dual scoring plus older scorecard/racks/finalize/correct endpoints. Confirm whether legacy endpoints still have a supported client.
10. **Trade admin exception overlaps Admin Players roster exceptions:** decide whether exceptional roster movement belongs on Trades, Admin Players, or both for intentionally different cases.
11. **Postseason controls are spread across Lineup and Season lifecycle APIs:** confirm where an admin starts playoffs/advances championship and where captains see the four-player/anchor workflow.
12. **#323 issue state looks stale:** rack-ledger implementation shipped, while final proof is #326.
13. **Test Drive identity:** `/demo` should be consistently labeled **Test Drive the App** per #249, not `Demo` or two competing names.
14. **Captain private phone:** #335 needs one obvious own-edit location and one obvious admin-view location; never place the number in Teams/player recruiting or Messages directories.
15. **Manual player/team creation + claim:** #340/#342/#341 are central to preseason administration but have no current completed API contracts. Verify their intended pages before implementation.
16. **Admin payment placement:** #121 needs a canonical admin page. `/admin/players` is plausible for person-level action; Season Management is plausible for roster-wide payment operation; Operations should only surface exceptions/deep-links.
17. **Ratings/identity review:** #92 likely belongs as Admin Players detail, but should be explicitly confirmed before creating another admin ratings page.
18. **Flexible schedule (#74):** a visible schedule exists, but no clear alternate-date/time/venue proposal API is documented. Decide whether Schedule owns the mutation, with Messages only supporting coordination.
19. **Historical standings (#180):** public read APIs can support season selection, but the page still needs the canonical dropdown/query-state behavior.
20. **Navigation consistency:** #239 now requires every route to be classified into full shell, mobile section, role-aware admin destination, or explicit exception. `/admin/season-teams` is the newest route most likely to expose drift.

---

# Suggested audit notation

When reviewing this file, add comments or a follow-up issue using one of these short decisions:

- **KEEP** — page/function/API ownership is correct.
- **MOVE -> `/route`** — story/function belongs elsewhere.
- **MISSING** — required story/function has no usable UI/API.
- **DUPLICATE** — another surface already owns this.
- **HIDE** — function exists but should not be user-visible to this audience.
- **REMOVE** — obsolete behavior/API should be retired after dependency check.
- **SPLIT** — page has more than one unrelated primary job.
- **MERGE** — separate pages should be one workflow.
- **NAME** — wording/navigation identity is wrong but ownership is correct.

The Product Librarian should convert confirmed audit decisions into focused GitHub issue updates, then update `docs/product-surface-catalog.md` so this audit sheet and the canonical catalog converge.