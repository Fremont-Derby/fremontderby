import test from 'node:test';
import assert from 'node:assert/strict';
import { recordRuleDecision } from '../src/ruleDecision.js';

test('a rule decision needs the rule, the impact, and a date', () => {
  assert.equal(recordRuleDecision({ rule: '', impact: 'changes eligibility', date: '2026-09-30' }).ok, false);
  assert.equal(recordRuleDecision({ rule: 'forfeit at 10 minutes', impact: '', date: '2026-09-30' }).ok, false);
  const saved = recordRuleDecision({ rule: 'forfeit at 10 minutes', impact: 'changes the score path', date: '2026-09-30' });
  assert.equal(saved.ok, true);
  assert.equal(saved.date, '2026-09-30');
});
