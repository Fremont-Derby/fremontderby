import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('team trades route allows GET for list', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  const idx = src.indexOf('teamTradeProposalMatch');
  assert.ok(idx > 0);
  // Find the handler block after match definition uses
  const handler = src.slice(src.indexOf('if (teamTradeProposalMatch)'));
  assert.match(handler, /request\.method === ["']GET["']/);
  assert.match(handler, /handleListOwnTeamTradesRequest/);
});
