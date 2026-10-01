import assert from 'node:assert/strict';
import test from 'node:test';
import { repairPracticeCopy } from '../src/practiceCopyRepair.js';
import { renderPracticePage } from '../src/publicShellPages.js';
import worker from '../src/routerEntry.js';

test('Gamma practice repair prefers DRU league-night makeup copy', () => {
  const repaired = repairPracticeCopy(renderPracticePage());
  assert.match(repaired, /Published league nights are the default table window/);
  assert.match(repaired, /practice or play a makeup/);
  assert.doesNotMatch(repaired, /Practice nights will show up here when the league publishes them/);
  assert.doesNotMatch(repaired, /Nothing is scheduled on this page yet/);
});

test('Gamma practice route HTML uses DRU practice copy', async () => {
  assert.match(renderPracticePage(), /Practice nights will show up here when the league publishes them/);
  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/practice'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Published league nights are the default table window/);
  assert.match(html, /practice or play a makeup/);
  assert.doesNotMatch(html, /Practice nights will show up here when the league publishes them/);
});
