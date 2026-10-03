import test from 'node:test';
import assert from 'node:assert/strict';
import { rulesSectionLine } from '../src/rulesSection.js';

test('a rules section names the topic', () => {
  assert.equal(rulesSectionLine('Handicap'), 'Rules: Handicap');
  assert.equal(rulesSectionLine(''), 'Rules: Rules');
});
