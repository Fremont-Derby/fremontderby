import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { repairAdminPlayersScript } from '../src/adminPlayersScriptRepair.js';

test('repaired admin players script parses', () => {
  const html = repairAdminPlayersScript(renderAdminPlayersPage());
  const script = html.split('<script>')[1].split('</script>')[0];
  new vm.Script(script);
});
