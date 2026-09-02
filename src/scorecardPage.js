import { liveRackLedgerAdapterSource } from './liveRackLedgerAdapter.js';
import { renderRackLedgerScorecardPage } from './rackLedgerScorecard.js';

export function renderScorecardPage() {
  return renderRackLedgerScorecardPage({
    title: 'Fremont Derby Scorecard',
    adapterSource: liveRackLedgerAdapterSource,
  });
}
