import assert from 'node:assert/strict';
import test from 'node:test';
import { PAGE_PATH_REDIRECTS } from '../src/pathAliases.js';
import router from '../src/router.js';

test('check-in URLs redirect to the availability page', async () => {
  assert.equal(PAGE_PATH_REDIRECTS['/check-in'], '/availability');
  assert.equal(PAGE_PATH_REDIRECTS['/checkin'], '/availability');

  for (const pathname of ['/check-in', '/checkin']) {
    const response = await router.fetch(new Request('https://fremontderby.com' + pathname), {});
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.get('location')).pathname, '/availability');
  }
});
