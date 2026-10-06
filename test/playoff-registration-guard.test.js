import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayoffHttpHandlers } from '../src/playoffHttp.js';

test('a registration season cannot start playoffs', async () => {
  const handlers = createPlayoffHttpHandlers({
    authenticate: async () => ({ id: 'actor-1' }),
    createRepository: () => { throw new Error('repository should not run'); },
  });
  const env = {
    ENVIRONMENT: 'dru',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'key',
  };
  const request = new Request('https://dru.fremontderby.com/api/admin/seasons/season-1/start-playoffs', { method: 'POST', body: '{}' });
  const response = await handlers.start(request, env, 'season-1', {
    fetch: async (url) => {
      if (String(url).includes('/seasons?')) return new Response(JSON.stringify([{ status: 'registration' }]), { status: 200 });
      return new Response('[]', { status: 200 });
    },
  });
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, 'All seven regular-season matchups must be complete before playoffs.');
});
