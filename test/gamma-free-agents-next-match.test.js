import assert from 'node:assert/strict';
import test from 'node:test';
import { renderFreeAgentsPage } from '../src/publicShellPages.js';
import worker from '../src/routerEntry.js';

test('Gamma free-agents page shows next match and invitations', async () => {
  const directHtml = renderFreeAgentsPage();
  assert.match(directHtml, /data-next-match/);
  assert.match(directHtml, /\/api\/me\/matches/);
  assert.match(directHtml, /pickNextMatch/);
  assert.match(directHtml, /\/api\/me\/invitations/);
  assert.match(directHtml, /data-invites/);

  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/free-agents'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-next-match/);
  assert.match(html, /No open roster list is published yet/);
});
