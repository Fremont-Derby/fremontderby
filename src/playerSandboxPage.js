import { renderRackLedgerScorecardPage } from './rackLedgerScorecard.js';
import { sandboxRackLedgerAdapterSource } from './sandboxRackLedgerAdapter.js';
import { applyScorecardProgressionRuntime } from './scorecardProgressionRuntime.js';

export function renderPlayerSandboxPage() {
  return applyScorecardProgressionRuntime(renderRackLedgerScorecardPage({
    title: 'Season 1 War Games · Score Match · Fremont Derby',
    adapterSource: sandboxRackLedgerAdapterSource(),
  }));
}
