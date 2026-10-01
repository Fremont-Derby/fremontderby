import assert from 'node:assert/strict';
import test from 'node:test';
import { repairPlayoffsCopy } from '../src/playoffsCopyRepair.js';
import { renderPlayoffsPage } from '../src/playoffsPage.js';
import worker from '../src/routerEntry.js';

test('Gamma playoffs repair prefers appear over show', () => {
  const repaired = repairPlayoffsCopy(renderPlayoffsPage());
  assert.match(repaired, /championship appear here once playoffs start/);
  assert.doesNotMatch(repaired, /championship show here once playoffs start/);
});

test('Gamma playoffs route HTML uses appear copy', async () => {
  assert.match(renderPlayoffsPage(), /championship show here once playoffs start/);
  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/playoffs'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /championship appear here once playoffs start/);
  assert.doesNotMatch(html, /championship show here once playoffs start/);
});
