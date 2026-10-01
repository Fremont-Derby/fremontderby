import test from 'node:test';
import assert from 'node:assert/strict';

test('HEAD on production home returns 200 with empty body', async () => {
  const response = await fetch('https://fremontderby.com/', { method: 'HEAD' });
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.equal(text, '');
  assert.match(response.headers.get('content-type') || '', /text\/html/i);
});

test('HEAD on production /health returns 200 with empty body', async () => {
  const response = await fetch('https://fremontderby.com/health', { method: 'HEAD' });
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.equal(text, '');
});
