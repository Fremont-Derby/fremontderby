import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Do work! protocol exists and prioritizes DNS canary', () => {
  const doc = readFileSync(new URL('../docs/do-work-protocol.md', import.meta.url), 'utf8');
  assert.match(doc, /Do work!/);
  assert.match(doc, /canary:dns/);
  assert.match(doc, /Restore lane custom domains/);
  assert.match(doc, /Out of scope/);
});

test('AGENTS and hybrid automation point at Do work protocol', () => {
  const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
  const hybrid = readFileSync(new URL('../docs/hybrid-hourly-automation.md', import.meta.url), 'utf8');
  assert.match(agents, /do-work-protocol/);
  assert.match(hybrid, /do-work-protocol/);
});
