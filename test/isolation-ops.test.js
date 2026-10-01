import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrder, druRulesetName, isolatedBinding, laneSeparation, productionAllowlist } from '../src/isolationOps.js';

test('a lane binding must not point at production', () => {
  assert.equal(isolatedBinding('dru', 'prod-db').ok, false);
  assert.equal(isolatedBinding('dru', 'dru-db').ok, true);
});

test('Gamma waits for the JFL build', () => {
  assert.equal(buildOrder(false).next, 'jfl');
});

test('an unknown production name is blocked', () => {
  assert.equal(productionAllowlist('other').ok, false);
});

test('lanes do not share a project', () => {
  assert.equal(laneSeparation([{ project: 'a' }, { project: 'a' }]).ok, false);
});

test('the DRU ruleset keeps its name', () => {
  assert.equal(druRulesetName('fremontderby-dru').ok, true);
});
