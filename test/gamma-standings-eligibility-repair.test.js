import assert from 'node:assert/strict';
import test from 'node:test';
import { repairStandingsPageScript } from '../src/standingsScriptRepair.js';

test('standings repair shows remaining plays instead of the raw minimum', () => {
  const source = "prize.append(showPrize?badge('Eligible #'+row.prize_rank,'ok'):(played?badge('Needs '+row.minimum_matches,'warn'):badge('\u2014','muted')));";
  const html = repairStandingsPageScript(source);
  assert.match(html, /Needs '\+remaining\+' more /);
  assert.doesNotMatch(html, /Needs '\+row\.minimum_matches/);
});

test('standings repair also rewrites the live prizeBadge assignment', () => {
  const source = "const prizeBadge=showPrize?badge('Eligible #'+row.prize_rank,'ok'):(played?badge('Needs '+row.minimum_matches,'warn'):badge('\u2014','muted'));";
  const html = repairStandingsPageScript(source);
  assert.match(html, /Needs '\+remaining\+' more /);
  assert.doesNotMatch(html, /Needs '\+row\.minimum_matches/);
});
