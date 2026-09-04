import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { renderPlayersDirectoryPage } from '../src/playersDirectoryPage.js';

test('player directory fetches public individual standings', () => {
  const html = renderPlayersDirectoryPage();
  assert.match(html, /\/api\/seasons\//);
  assert.match(html, /individual-standings/);
  assert.doesNotMatch(html, /player_id/);
  const script = html.split('<script>')[1].split('</script>')[0];
  new vm.Script(script);
});
