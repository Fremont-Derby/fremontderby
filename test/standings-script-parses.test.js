import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { renderStandingsPage } from '../src/standingsPage.js';

test('standings page inline script parses', () => {
  const html = renderStandingsPage();
  const script = html.split('<script>')[1].split('</script>')[0];
  assert.ok(script.includes('function renderTeams'));
  new vm.Script(script);
});
