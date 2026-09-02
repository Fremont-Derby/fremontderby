export const sharedRackLedgerScorecardMarkup = `
  <main class="scorecard-app" data-shared-rack-ledger-scorecard data-primary-scoring>
    <div class="scorecard-status" data-status aria-live="polite">Loading…</div>
    <aside class="sandbox-banner" data-sandbox-banner hidden><strong>SEASON 1 WAR GAMES · THROWAWAY DATA</strong><span>No sign-in or setup required. You are using the production scoring interface against isolated practice data.</span></aside>
    <div class="match-context"><span data-match-context>Loading round and match…</span><a data-switch-match href="/scorecard">Switch match</a></div>
    <section class="perspective" data-perspective aria-label="Practice scoring perspective"><span>Recording for</span><button data-perspective-side="A" type="button" aria-pressed="false">Team A</button><button data-perspective-side="B" type="button" aria-pressed="false">Team B</button></section>

    <section class="opening-setup" data-opening-setup aria-label="Opening game order">
      <div class="opening-copy"><strong>Order</strong><span data-opening-note>Choose before rack 1. Racks 1–3 use this game.</span></div>
      <div class="opening-options"><button class="opening-option" data-opening="8-ball" type="button" aria-pressed="false">8 first</button><button class="opening-option" data-opening="9-ball" type="button" aria-pressed="false">9 first</button></div>
    </section>

    <section class="team-score" aria-label="Running team score">
      <div class="team-score-label">Running team score</div>
      <div class="team-score-grid">
        <div class="team-block"><span class="team-name" data-team-a-name>Team A</span><strong class="team-points" data-team-score-a>0</strong></div>
        <span class="team-separator">—</span>
        <div class="team-block"><span class="team-name" data-team-b-name>Team B</span><strong class="team-points" data-team-score-b>0</strong></div>
      </div>
    </section>

    <section class="race" aria-label="Current individual race">
      <div class="race-context"><span>Current individual race</span><strong data-race-status>Scheduled</strong></div>
      <div class="players">
        <article class="player"><h2 class="player-name" data-player-a-name>Player A</h2><div class="player-meta" data-player-a-rating>Rating</div><div class="race-target">Race to <b data-target-a>–</b></div></article>
        <div class="individual-score" aria-label="Individual match score"><span data-score-a>0</span><span>—</span><span data-score-b>0</span></div>
        <article class="player"><h2 class="player-name" data-player-b-name>Player B</h2><div class="player-meta" data-player-b-rating>Rating</div><div class="race-target">Race to <b data-target-b>–</b></div></article>
      </div>

      <section class="ledger-panel" aria-label="Rack-by-rack score ledger">
        <header class="ledger-head"><strong>Rack ledger</strong><span class="ledger-state" data-ledger-state>Loading both submissions…</span></header>
        <div class="ledger-scroll" data-ledger-scroll><table class="ledger" data-ledger><thead></thead><tbody></tbody></table></div>
        <div class="ledger-help">ⓘ Tap any rack on your row to edit only that rack.</div>
      </section>
    </section>

    <section class="edit-panel" data-edit-panel hidden aria-live="polite">
      <div class="edit-head"><div><strong>Edit Rack <span data-edit-rack-number>–</span> · <span data-edit-discipline>–</span></strong><span>Change only your team’s submission.</span></div><button class="edit-close" data-edit-close type="button" aria-label="Close rack editor">×</button></div>
      <div class="edit-compare"><div class="edit-value"><span data-edit-own-label>Your submission</span><strong data-edit-own-value>–</strong></div><div class="edit-value"><span data-edit-opponent-label>Other team</span><strong data-edit-opponent-value>–</strong></div></div>
      <div class="edit-actions"><button class="edit-result" data-edit-result="W" type="button">W · Win</button><button class="edit-result" data-result="L" data-edit-result="L" type="button">L · Loss</button></div>
      <p class="edit-note">Later racks stay exactly as entered. Changing this rack clears your team’s confirmation so the corrected score can be confirmed again.</p>
    </section>

    <section class="next-rack" aria-label="Record next rack"><button class="add-rack primary" data-add-rack type="button">Add Rack 1</button><div class="winner-picker" data-winner-picker><button class="winner" data-rack-a data-side="A" type="button">Player A wins</button><button class="winner" data-rack-b data-side="B" type="button">Player B wins</button></div><span hidden data-next-rack>1</span><span hidden data-next-discipline>8-ball</span></section>

    <section class="reconcile" data-reconcile aria-live="polite"><strong data-reconcile-title>Loading both score records…</strong><span data-reconcile-detail></span></section>
    <section class="quick-actions" aria-label="Score controls"><button class="ghost" data-edit-current type="button">Edit Rack</button><details class="details"><summary>Match details</summary><div class="detail-grid"><div class="detail"><span>Opening order</span><strong data-detail-opening>–</strong></div><div class="detail"><span>First break</span><strong data-detail-break>–</strong></div><div class="detail"><span>Match status</span><strong data-detail-status>–</strong></div><div class="detail"><span>Scoring for</span><strong data-detail-team>–</strong></div></div></details><button class="undo ghost" data-undo type="button">Undo Last Rack</button></section>
    <section class="completion-actions"><button class="confirm" data-confirm type="button">Confirm this side</button><button class="finalize danger" data-finalize type="button">Finalize match</button></section>

    <section class="sandbox-footer" data-sandbox-footer hidden><strong>Practice feedback</strong><p>Tell us what was confusing while it is fresh.</p><textarea data-sandbox-feedback placeholder="What was confusing?"></textarea><div class="sandbox-footer-actions"><button data-save-feedback type="button">Save feedback on this device</button><a href="/demo">Review the full Season 1 Test Drive</a></div></section>
  </main>
  <div class="error-popup" data-error role="alert"><strong>Couldn’t complete that action</strong><span data-error-message></span></div>
`;
