# Team approval Notice — #3637

The proposed JFL-only producer sends one operational Notice to the linked
applicant when the existing Admin approval transaction creates their team,
captain membership and season slot. The fixed message names that team and
season. `/teams?view=mine` means **View your teams**, not an application-form
or exact-team deep link. The recipient can find the approved captain team and
open its roster. Admin notes, contact details and arbitrary message text are
not included. General, Team and Direct consent are untouched.

The approval transition and recipient/application event index prevent duplicate
delivery. Defer, reject, unchanged status and unlinked records do not notify.
The trigger uses SECURITY INVOKER inside the existing qualified postgres-owned
approval function; it adds no privileged/browser-callable write endpoint.
Its empty search path, original RPC source/owner checks, current RLS/no-browser
grants and absence guards must all pass before installation.

## Current proof and limits

The card records installation and hosted rollback proof separately from actual
delivery and browser acceptance. Neither installation nor rollback-only approval
proves a persisted recipient journey.
The local script runs the captured JFL approval/read functions on a **minimal**
PostgreSQL fixture. It substitutes readiness/expiry helpers and therefore does
not prove the hosted schema, roster/contact policy or application UI. PGlite
0.5.12 uses PostgreSQL18.6; the qualified hosted project currently uses17.6.
The 18 local checks cover source/RLS guards, recipient/template, duplicate events,
read-state preservation, browser privilege denial, approval failure rollback,
transaction rollback and peer-table preservation. The captured read-state RPC
rejects a nonrecipient or missing Notice with `Notification not found`; the
verifier catches that exact denial and proves the recipient stays unread.
Recipient read and repeated-read timestamp preservation use the unchanged RPC.
Browser action tests intercept
all APIs; they prove the Notice/read/owned-team UI contract, not live delivery.

To reproduce the local SQL proof, install `@electric-sql/pglite@0.5.12` in a
temporary directory, set `JFL_SQL_TEST_RUNTIME_PACKAGE_JSON` to that directory's
absolute package.json path, then run
`node scripts/verify-jfl-approval-notice-local.mjs` from the repository root.
No network or hosted credentials are used by that script. The two SQL files in
test/fixtures are local-only inputs and must never be applied to a hosted DB.

## Installation and acceptance gate

1. Finish every preceding trusted browser/reset mission and independently
   verify cleanup. Respect the current #3627/#3633 release sequence and fixture
   lease; no DDL, rollback-only SQL or live event overlaps a browser/reset.
2. Review the narrow migration and require all current-head checks. Independently
   verify healthy JFL/environment/schema, exact current SHA and the isolated
   project `oqkkvqkerusepyokzbmt`. The tool's project ID is part of the guard;
   the SQL file alone cannot identify a Supabase project.
3. Capture current notification/approval definitions, grants and outside-JFL
   function/table fingerprints. Apply only the reviewed migration with the
   established JFL migration path, using canonical UTF-8/LF SQL text (normalize
   Windows CRLF before submitting so the exact function-source hash is stable).
   It is a one-time, fail-closed migration;
   inspect migration history after uncertain outcomes instead of reapplying it.
4. Run `scripts/inspect-jfl-approval-notice.sql`, verify exact installed hash,
   index, trigger, unchanged original RPCs/grants and outside-JFL fingerprints.
   Run `scripts/verify-jfl-approval-notice.sql` for rollback-only normal RPC
   and adversarial proof against hosted PostgreSQL17 before
   representing the local proof as hosted acceptance.
5. Through normal authenticated commands, use one owned private synthetic QA
   season, a known linked synthetic applicant and an Admin. Approve the actual
   application, verify one recipient Notice and nonrecipient isolation, open
   owned teams, mark read and refresh. Capture known IDs before mutations,
   honor observed Retry-After and never replay uncertain creation/approval.
6. End the browser first, then independently qualify and clean only the owned
   QA children, exact source-event Notice, captured synthetic audit/outbox rows.
   Restore prior hashes and captured social preferences; record exact deployed
   SHA, source/controlled/SQL/live scope and remaining human/DRU gates.

Installation must occur in the exclusive gap after prerequisite proof and before
the next merge-triggered reset. A source merge alone is not migration apply or
Notice acceptance. Keep #3637/#3614 open until their full criteria are met.

## Exceptional rollback

`scripts/rollback-jfl-approval-notice.sql` checks the exact new producer and
binding, removes only its trigger/function/index without CASCADE, and verifies
that all Notice rows/read state are unchanged. It does not delete history,
change grants or undo approval state. Use only for an evidence-backed rollback
under the exclusive fixture lease; unfamiliar definitions stop the operation.
