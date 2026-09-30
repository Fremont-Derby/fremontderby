import { liveRackLedgerAdapterSource } from './liveRackLedgerAdapter.js';
import { renderRackLedgerScorecardPage } from './rackLedgerScorecard.js';

const liveScorecardSelectionStyles = `
  .opening-option[aria-pressed="true"],
  .edit-result[aria-pressed="true"]{
    background:#08783f!important;
    border-color:#08783f!important;
    color:#fff!important;
    box-shadow:inset 0 0 0 2px rgba(255,255,255,.18);
  }
  .opening-option[aria-pressed="true"]:disabled{
    opacity:1;
  }
  .opening-option[aria-pressed="false"],
  .edit-result[aria-pressed="false"]{
    background:#fff!important;
    border-color:#c8cfca!important;
    color:#075f36!important;
  }
  .opening-option:focus-visible,
  .edit-result:focus-visible{
    outline:3px solid #d6a900;
    outline-offset:2px;
  }
  .next-rack [data-undo]{
    width:100%;
    margin-top:8px;
    min-height:50px;
    background:#fff;
    border-color:#c8cfca;
    color:#075f36;
  }
  .next-rack [data-undo]:disabled{
    display:none;
  }
`;

const liveScorecardEnhancementsScript = `
  <script>
    (() => {
      let fallbackScoringRowIndex = null;

      function liveState() {
        return window.fdRackLedgerState || {};
      }

      function scoringRowIndex(rows) {
        const state = liveState();
        if (state.ownSide === 'A') return 0;
        if (state.ownSide === 'B') return 1;
        const editableIndex = rows.findIndex((row) => row.querySelector('.rack-edit'));
        if (editableIndex >= 0) fallbackScoringRowIndex = editableIndex;
        return fallbackScoringRowIndex;
      }

      function placeUndoButton() {
        const undoButton = document.querySelector('[data-undo]');
        const nextRack = document.querySelector('.next-rack');
        if (!undoButton || !nextRack) return;
        const state = liveState();
        const canUndo = Number(state.ownRackCount || 0) > 0 && !state.locked;
        if (canUndo) undoButton.disabled = false;
        undoButton.textContent = state.ownConfirmed ? 'Undo last rack & unlock' : 'Undo last rack';
        undoButton.classList.remove('ghost');
        if (undoButton.parentElement !== nextRack) nextRack.appendChild(undoButton);
        if (undoButton.dataset.confirmBound === 'true') return;
        undoButton.dataset.confirmBound = 'true';
        undoButton.addEventListener('click', (event) => {
          if (undoButton.disabled) return;
          const confirmed = Boolean(liveState().ownConfirmed);
          const message = confirmed
            ? 'Undo your last rack? This also unlocks your submitted score so you can correct it.'
            : 'Undo the last rack you entered? This removes only your team\\'s most recent rack.';
          if (!window.confirm(message)) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        }, true);
      }

      function removeRedundantCards() {
        document.querySelector('[data-edit-current]')?.remove();
        document.querySelector('.quick-actions .details')?.remove();
        const quickActions = document.querySelector('.quick-actions');
        if (quickActions && !quickActions.querySelector('button, details')) quickActions.remove();
      }

      function syncLiveScore() {
        const rows = Array.from(document.querySelectorAll('[data-ledger] tbody tr')).slice(0, 2);
        if (rows.length < 2) return;
        const rowIndex = scoringRowIndex(rows);
        if (rowIndex === null || rowIndex === undefined || !rows[rowIndex]) return;

        const ownRow = rows[rowIndex];
        const wins = ownRow.querySelectorAll('.submission[data-value="W"]').length;
        const losses = ownRow.querySelectorAll('.submission[data-value="L"]').length;
        const scoreA = document.querySelector('[data-score-a]');
        const scoreB = document.querySelector('[data-score-b]');
        if (!scoreA || !scoreB) return;

        if (rowIndex === 0) {
          scoreA.textContent = String(wins);
          scoreB.textContent = String(losses);
        } else {
          scoreA.textContent = String(losses);
          scoreB.textContent = String(wins);
        }

        const label = document.querySelector('.race-context > span:first-child');
        if (label) label.textContent = 'Live individual score';
      }

      function syncEnhancements() {
        placeUndoButton();
        removeRedundantCards();
        syncLiveScore();
      }

      requestAnimationFrame(syncEnhancements);
      const ledger = document.querySelector('[data-ledger]');
      if (ledger) {
        new MutationObserver(syncEnhancements).observe(ledger, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['data-value', 'class']
        });
      }
    })();
  </script>
`;

export function renderScorecardPage() {
  return renderRackLedgerScorecardPage({
    title: 'Fremont Derby Scorecard',
    adapterSource: liveRackLedgerAdapterSource,
  })
    .replace('</head>', `<style>${liveScorecardSelectionStyles}</style></head>`)
    .replace('</body>', `${liveScorecardEnhancementsScript}</body>`);
}
