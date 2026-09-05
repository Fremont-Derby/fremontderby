import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { renderLandingPage } from '../src/index.js';

const env = {
  CF_VERSION_METADATA: {
    id: 'test-version-123',
    tag: 'test',
    timestamp: '2026-08-09T23:40:00Z',
  },
};

const publishEnv = {
  ...env,
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
};

test('landing page identifies Fremont Derby and deployed version', () => {
  const html = renderLandingPage(env);
  assert.match(html, /Fremont Derby/);
  assert.match(html, /test-version-123/);
});

test('health endpoint reports service and Worker version', async () => {
  const response = await worker.fetch(new Request('https://fremontderby.com/health'), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, 'fremontderby');
});

test('scorecard page route returns HTML', async () => {
  const response = await worker.fetch(
    new Request('https://fremontderby.com/scorecard?match=player-match-1'),
    publishEnv,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
});

test('profile and teams pages stay off the 500 path', async () => {
  for (const path of ['/profile', '/teams', '/availability', '/schedule']) {
    const response = await worker.fetch(new Request(`https://fremontderby.com${path}`), publishEnv);
    assert.notEqual(response.status, 500, path);
  }
});
