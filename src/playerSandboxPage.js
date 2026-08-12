import { renderRackLedgerScorecardPage } from './rackLedgerScorecard.js';
import { sandboxRackLedgerAdapterSource } from './sandboxRackLedgerAdapter.js';

export function renderPlayerSandboxPage() {
  return renderRackLedgerScorecardPage({
    title: 'Season 1 War Games · Score Match · Fremont Derby',
    adapterSource: sandboxRackLedgerAdapterSource(),
  });
}
