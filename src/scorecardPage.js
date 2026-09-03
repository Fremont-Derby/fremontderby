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
`;

export function renderScorecardPage() {
  return renderRackLedgerScorecardPage({
    title: 'Fremont Derby Scorecard',
    adapterSource: liveRackLedgerAdapterSource,
  }).replace('</head>', `<style>${liveScorecardSelectionStyles}</style></head>`);
}
