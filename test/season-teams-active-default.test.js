import assert from 'node:assert/strict';
import test from 'node:test';
import { repairAdminSeasonTeamsScript } from '../src/adminSeasonTeamsScriptRepair.js';

test('season teams repair prefers the active season', () => {
  const source = "const requested=new URLSearchParams(location.search).get('season');if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;";
  const repaired = repairAdminSeasonTeamsScript(source);
  assert.match(repaired, /status==='active'/);
});
