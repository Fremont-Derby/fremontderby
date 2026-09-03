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

const liveScorecardUndoPlacementScript = `
  <script>
    (() => {
      const undoButton = document.querySelector('[data-undo]');
      const nextRack = document.querySelector('.next-rack');
      if (!undoButton || !nextRack) return;
      undoButton.textContent = 'Undo last rack';
      undoButton.classList.remove('ghost');
      nextRack.appendChild(undoButton);
      undoButton.addEventListener('click', (event) => {
        if (undoButton.disabled) return;
        if (!window.confirm('Undo the last rack you entered? This removes only your team\\'s most recent rack.')) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    })();
  </script>
`;

export function renderScorecardPage() {
  return renderRackLedgerScorecardPage({
    title: 'Fremont Derby Scorecard',
    adapterSource: liveRackLedgerAdapterSource,
  })
    .replace('</head>', `<style>${liveScorecardSelectionStyles}</style></head>`)
    .replace('</body>', `${liveScorecardUndoPlacementScript}</body>`);
}
