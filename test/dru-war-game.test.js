import test from 'node:test';
import assert from 'node:assert/strict';
import { druWarGameEnabled, renderDruWarGamePage } from '../src/druWarGamePage.js';

test('the war game page is DRU only and names a champion', () => {
  assert.equal(druWarGameEnabled({ ENVIRONMENT: 'dru' }), true);
  assert.equal(druWarGameEnabled({ ENVIRONMENT: 'gamma' }), false);
  assert.match(renderDruWarGamePage(), /Season champion: Bluebird Break/);
  assert.match(renderDruWarGamePage(), /does not change Season 1/);
});
