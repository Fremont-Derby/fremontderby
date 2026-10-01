import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPrizesPage } from '../src/prizesPage.js';

test('the prizes page defines readJson in the browser script', () => {
  const html = renderPrizesPage();
  const script = html.split('<script>').pop();
  assert.match(script, /async function readJson/);
  assert.match(script, /Prizes did not return data/);
});
