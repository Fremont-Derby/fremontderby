import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlayoffsPage } from '../src/playoffsPage.js';

test('playoffs page explains the empty bracket and points at standings seeds', () => {
  const html = renderPlayoffsPage();
  assert.match(html, /data-fd-dru-playoffs/);
  assert.match(html, /data-playoff-empty/);
  assert.match(html, /href="\/standings">Standings</);
  assert.match(html, /Seeds come from Standings/);
});
