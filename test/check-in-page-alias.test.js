import assert from 'node:assert/strict';
import test from 'node:test';
import { PAGE_PATH_REDIRECTS } from '../src/pathAliases.js';
import router from '../src/router.js';

const EXPECTED = {
  '/check-in': '/availability',
  '/checkin': '/availability',
  '/score': '/scorecard',
  '/scores': '/scorecard',
  '/chat': '/messages',
  '/message': '/messages',
  '/notices': '/notifications',
  '/alerts': '/notifications',
  '/login': '/profile',
  '/signin': '/profile',
  '/sign-in': '/profile',
  '/account': '/profile',
};

test('human page labels redirect to canonical routes', async () => {
  assert.deepEqual(PAGE_PATH_REDIRECTS, EXPECTED);

  for (const [from, to] of Object.entries(EXPECTED)) {
    const response = await router.fetch(new Request('https://fremontderby.com' + from), {});
    assert.equal(response.status, 302, from);
    assert.equal(new URL(response.headers.get('location')).pathname, to, from);
  }
});
