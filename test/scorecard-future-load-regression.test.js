import test from 'node:test';
import assert from 'node:assert/strict';

import { renderScorecardPage } from '../src/scorecardPage.js';

test('unavailable future scorecard hides placeholder scoring UI and offers recovery', () => {
  const html = renderScorecardPage();

  assert.match(html, /data-load-recovery role="alert" hidden/);
  assert.match(html, /data-load-retry/);
  assert.match(html, /This scheduled matchup has no scoreable race yet/);
  assert.match(html, /Check the lineup reveal or choose another match/);
  assert.match(html, /data-load-state=unavailable\] \.team-score/);
  assert.match(html, /data-load-state=unavailable\] \.race/);
  assert.match(html, /if\(action===loadAll&&!currentScorecard\)\{showLoadFailure\(error\);return\}/);
  assert.match(html, /appEl\.dataset\.loadState='ready';loadRecoveryEl\.hidden=true/);
  assert.match(html, /\[data-load-retry\]'\)\.addEventListener\('click',\(\)=>run\(loadAll\)\)/);
});
