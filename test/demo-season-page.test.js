import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDemoSeasonPage } from '../src/demoSeasonPage.js';

test('demo season is complete, fictional, and read only', () => {
  const html = renderDemoSeasonPage();

  assert.match(html, /DEMO SEASON/);
  assert.match(html, /FICTIONAL READ-ONLY DATA/);
  assert.match(html, /Season 1 Demo/);
  assert.match(html, /28 team matchups/);
  assert.match(html, /Round 1/);
  assert.match(html, /Round 7/);
  assert.match(html, /Break Room Bandits/);
  assert.match(html, /Jamie Park \(sub\)/);
  assert.match(html, /Example 8\/9 race/);
  assert.match(html, /Maya race 5 · Eli race 4/);
  assert.doesNotMatch(html, /fetch\s*\(/);
  assert.doesNotMatch(html, /\/api\//);
});
