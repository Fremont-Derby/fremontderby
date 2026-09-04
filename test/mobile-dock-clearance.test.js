import assert from 'node:assert/strict';
import test from 'node:test';
import { siteStyles } from '../src/siteStyles.js';
import router from '../src/routerEntry.js';

test('mobile dock clearance is reserved on the document', () => {
  assert.match(siteStyles, /padding-bottom: calc\(96px \+ env\(safe-area-inset-bottom\)\) !important/);
  assert.match(siteStyles, /\.fd-mobile-dock-spacer/);
});

test('home HTML includes dock clearance styles', async () => {
  const response = await router.fetch(new Request('https://dru.fremontderby.test/'), {}, {});
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /fd-mobile-dock-spacer/);
  assert.match(html, /padding-bottom: calc\(96px \+ env\(safe-area-inset-bottom\)\)/);
});
