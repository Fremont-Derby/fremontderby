import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { renderScorecardPage } from '../src/scorecardPage.js';

test('live scorecard inline scripts parse after HTML template interpolation', () => {
  const html = renderScorecardPage();
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1]);
  assert.equal(scripts.length, 3);
  assert.match(scripts[2], /function syncLiveScore\(\)/);
  for (const [index, source] of scripts.entries()) {
    assert.doesNotThrow(() => new vm.Script(source, { filename: `live-scorecard-${index}.js` }));
  }
});
