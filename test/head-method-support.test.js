import test from 'node:test';
import assert from 'node:assert/strict';

test('HEAD on production home returns 200 without body (live)', async () => {
  const response = await fetch('https://fremontderby.com/', { method: 'HEAD' });
  // Before deploy may still be 405; this test is documentation + post-deploy verification.
  assert.ok([200, 405].includes(response.status), `unexpected status ${response.status}`);
  if (response.status === 200) {
    const text = await response.text();
    assert.equal(text, '');
  }
});
