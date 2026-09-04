import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { renderStandingsPage } from '../src/standingsPage.js';
import { repairStandingsPageScript } from '../src/standingsTheme.js';
import router from '../src/routerEntry.js';

test('repaired standings page script parses', () => {
  const script = repairStandingsPageScript(renderStandingsPage())
    .split('<script>')[1]
    .split('</script>')[0];
  new vm.Script(script);
});

test('live standings HTML script parses after theme injection', async () => {
  const response = await router.fetch(new Request('https://dru.fremontderby.test/standings'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  const script = html.split('<script>').pop().split('</script>')[0];
  new vm.Script(script);
});
