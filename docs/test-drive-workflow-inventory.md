# Test Drive workflow inventory

Issue #387 defines Test Drive / War Games as a QA harness around production behavior, not a second Fremont Derby application. This inventory classifies every current Test Drive action so future changes can tell whether they must reuse production implementation or remain intentionally fictional orientation.

## Evidence rule

A Test Drive result is implementation evidence only when the exercised behavior comes from the same production component/controller/domain module with a sandbox adapter or safe fixture inputs. Fictional orientation may teach product concepts, but it is not proof that the corresponding production mutation works. Real authentication, authorization, concurrency, deployment, and multi-user behavior still require their dedicated production/human checks.

## Current inventory

| Test Drive surface / action | Classification | Production owner | Contract |
| --- | --- | --- | --- |
| `/demo` entry and drill navigation | Presentation-only orientation | Shared app navigation / linked canonical surfaces | Explains where to practice; does not simulate a production mutation. |
| `/sandbox/player` rack entry, 8/9 opening order, W/L ledger, mismatch/pending state, old-rack correction, undo, confirmation/finalization controls, remote-change recovery | Shared production component + sandbox adapter | `/scorecard/live` via `src/rackLedgerScorecard.js` | Player War Games renders the production rack-ledger component/controller and swaps only the isolated fictional adapter from `src/sandboxRackLedgerAdapter.js`. |
| `/sandbox/captain` team-formation request approvals/rejections | Presentation-only orientation | `/teams` for real applications/invitations/roster relationships | The drill uses fictional session state only. It teaches the captain concept but does not claim to prove a real Teams mutation. |
| `/sandbox/captain` practice availability switches | Presentation-only orientation feeding a production-shaped fixture | `/schedule` for real dated availability | The switches only construct fictional candidate state for the shared lineup drill. They do not call or imitate the production availability persistence path. |
| `/sandbox/captain` roster/substitute picker, exactly three ordered slots, duplicate/eligibility validation, forfeit behavior, correction controls, blind lock/reveal, score-ready state | Shared production component + sandbox adapter | `/lineup` via `src/blindLineupComponent.js` | Captain War Games renders the same blind-lineup markup/controller as production and supplies fictional candidates/lineups through its isolated adapter. |
| `/sandbox/captain` midseason roster remove/replacement exercise | Presentation-only orientation | `/teams` / admin exception workflows | Fictional session-only state demonstrates roster-change concepts; it is not production roster-mutation evidence. |
| `/sandbox/captain` feedback draft / clear | Sandbox-only support behavior | None | Captures local throwaway QA notes and is not a simulated league workflow. |
| `/sandbox/captain` reset War Game | Sandbox-only support behavior | None | Clears fictional session state only. |

## Drift rules

- Do not add a new Test Drive control that performs a production-like action unless it either consumes the production implementation with an isolated adapter/safe fixture or this inventory explicitly documents why it is orientation-only.
- Shared scoring and blind-lineup behavior must not be reimplemented in sandbox page code.
- Orientation-only controls must remain clearly fictional/throwaway and must not call production APIs, Supabase, or production authentication/session state.
- Production changes to scoring or blind-lineup behavior should automatically appear in Test Drive through their shared modules.
- If an orientation exercise grows into a fidelity claim for a real production workflow, create a focused child issue to extract/reuse the production component before treating the exercise as QA proof.

## Current QA interpretation

Deterministic Player War Games results are valid evidence for the shared rack-ledger component/controller. Deterministic Captain War Games lineup results are valid evidence for the shared blind-lineup component/controller. Team formation, availability-switch, and midseason-churn exercises are explanatory fictional orientation only and must not be cited as proof that their production HTTP/database workflows work.

Physical two-human and deployed-runtime proof remain separate under the release/QA issues that own authentication, concurrency, phone usability, and exact deployed-version validation.
