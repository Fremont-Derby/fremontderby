import { liveRackLedgerAdapterSource } from './liveRackLedgerAdapter.js';
import { renderRackLedgerScorecardPage } from './rackLedgerScorecard.js';
import { applyScorecardProgressionRuntime } from './scorecardProgressionRuntime.js';

export function renderScorecardPage() {
  return applyScorecardProgressionRuntime(renderRackLedgerScorecardPage({
    title: 'Fremont Derby Scorecard',
    adapterSource: liveRackLedgerAdapterSource,
  }));
}
