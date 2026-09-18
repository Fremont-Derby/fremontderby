import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';
import worker from '../src/routerEntry.js';

test('Gamma season teams page prefers the active season when URL omits ?season=', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(
    html,
    /const requested=new URLSearchParams\(location\.search\)\.get\('season'\);if\(requested&&seasons\.some\(item=>item\.id===requested\)\)seasonSelect\.value=requested;else\{const active=seasons\.find\(item=>item\.status==='active'\);if\(active\)seasonSelect\.value=active\.id\}/,
  );
  assert.match(html, /status==='active'/);
});

test('Gamma season teams route still honors an explicit ?season= override', async () => {
  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/admin/season-teams?season=season-registration'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /if\(requested&&seasons\.some\(item=>item\.id===requested\)\)seasonSelect\.value=requested/);
  assert.match(html, /else\{const active=seasons\.find\(item=>item\.status==='active'\);if\(active\)seasonSelect\.value=active\.id\}/);
});
