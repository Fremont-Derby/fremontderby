import assert from 'node:assert/strict';
import test from 'node:test';
import { createStandingsRepository } from '../src/standingsRepository.js';

test('listPublicSeasons falls back to seasons table when RPC is denied', async () => {
  const calls = [];
  const repository = createStandingsRepository(
    {
      ENVIRONMENT: 'production',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    },
    {
      fetch: async (url, init) => {
        calls.push({ url: String(url), method: init?.method });
        if (String(url).includes('list_public_season_registration')) {
          return new Response(JSON.stringify({ message: 'permission denied for function list_public_season_registration' }), {
            status: 401,
          });
        }
        if (String(url).includes('/rest/v1/seasons')) {
          return new Response(
            JSON.stringify([
              { id: 's1', name: 'Solstice', status: 'registration', first_round_date: '2028-06-01' },
            ]),
            { status: 200 },
          );
        }
        return new Response('{}', { status: 404 });
      },
    },
  );

  const seasons = await repository.listPublicSeasons();
  assert.equal(seasons.length, 1);
  assert.equal(seasons[0].id, 's1');
  assert.equal(seasons[0].name, 'Solstice');
  assert.equal(seasons[0].status, 'registration');
  assert.ok(calls.some((c) => c.url.includes('list_public_season_registration')));
  assert.ok(calls.some((c) => c.url.includes('/rest/v1/seasons')));
});

test('listPublicSeasons uses RPC payload when available', async () => {
  const repository = createStandingsRepository(
    {
      ENVIRONMENT: 'production',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    },
    {
      fetch: async (url) => {
        if (String(url).includes('list_public_season_registration')) {
          return new Response(
            JSON.stringify([
              {
                id: 's2',
                name: 'War Game',
                status: 'complete',
                first_round_date: null,
                team_count: 8,
              },
            ]),
            { status: 200 },
          );
        }
        throw new Error(`unexpected ${url}`);
      },
    },
  );
  const seasons = await repository.listPublicSeasons();
  assert.equal(seasons[0].teamCount, 8);
});

test('listPublicSeasons falls back when RPC returns opaque 401', async () => {
  const repository = createStandingsRepository(
    {
      ENVIRONMENT: 'production',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    },
    {
      fetch: async (url) => {
        if (String(url).includes('list_public_season_registration')) {
          return new Response(JSON.stringify({ message: 'Invalid API key' }), { status: 401 });
        }
        if (String(url).includes('/rest/v1/seasons')) {
          return new Response(JSON.stringify([{ id: 's3', name: 'Fallback', status: 'registration' }]), { status: 200 });
        }
        return new Response('{}', { status: 500 });
      },
    },
  );
  const seasons = await repository.listPublicSeasons();
  assert.equal(seasons[0].id, 's3');
});
