import { applyScorecardProgressionRuntime } from './scorecardProgressionRuntime.js';
import { sharedRackLedgerScorecardStyles } from './rackLedgerScorecardStyles.js';
import { sharedRackLedgerScorecardMarkup } from './rackLedgerScorecardMarkup.js';
import { sharedRackLedgerScorecardControllerSource } from './rackLedgerScorecardController.js';

export {
  sharedRackLedgerScorecardStyles,
  sharedRackLedgerScorecardMarkup,
  sharedRackLedgerScorecardControllerSource,
};

export function renderRackLedgerScorecardPage({
  title = 'Fremont Derby Scorecard',
  adapterSource,
} = {}) {
  if (!adapterSource) throw new Error('adapterSource is required');
  return applyScorecardProgressionRuntime(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>${sharedRackLedgerScorecardStyles}</style>
</head>
<body>
${sharedRackLedgerScorecardMarkup}
<script>${adapterSource}</script>
<script>${sharedRackLedgerScorecardControllerSource}</script>
</body>
</html>`);
}
