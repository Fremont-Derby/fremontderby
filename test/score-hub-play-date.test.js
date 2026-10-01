import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('score hub uses play-date semantics and league-night tools', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /function playDate/);
  assert.match(src, /playDate\(match\)===selectedDate/);
  assert.match(src, /data-hub-tools/);
  assert.match(src, /Check availability/);
  assert.match(src, /Makeup\/play date/);
});

test('admin teams can change captain', () => {
  const src = readFileSync(new URL('../src/adminSeasonTeamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /Change captain/);
  assert.match(src, /function canAssignCaptain\(row\)\{return isTargetSeasonTeam\(row\)\}/);
});
