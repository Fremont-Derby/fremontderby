import test from 'node:test';
import assert from 'node:assert/strict';
import { skillLevelLine } from '../src/skillLevelLine.js';

test('a player card names the skill level', () => {
  assert.equal(skillLevelLine('4'), 'Skill: 4');
  assert.equal(skillLevelLine(''), 'Skill not set');
});
