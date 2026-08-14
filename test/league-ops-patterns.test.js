
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderTeamsPage } from '../src/teamsPage.js';

test('captain invite confirms when the chosen name may be ambiguous', () => {
  const html = renderTeamsPage();
  assert.match(html, /More than one player may share this name/);
  assert.match(html, /isDuplicateName/);
});

test('lineup disambiguates duplicate roster names for night-of clarity', () => {
  const source = readFileSync(new URL('../src/blindLineupComponent.js', import.meta.url), 'utf8');
  assert.match(source, /labelDuplicateCandidates/);
  assert.match(source, /_label/);
});

test('claim flow confirms ambiguous prepared records', () => {
  const source = readFileSync(new URL('../src/profilePlayerClaimEnhancer.js', import.meta.url), 'utf8');
  assert.match(source, /claimDuplicate/);
  assert.match(source, /More than one prepared player may share this name/);
});
