import assert from 'node:assert/strict';
import test from 'node:test';

import { createPlayoffHttpHandlers } from '../src/playoffHttp.js';
import { createScorableMatchesHttpHandlers } from '../src/scorableMatchesHttp.js';

const missingAuthShape = { error: 'Missing bearer token' };

test('protected me/admin adapters return the same 401 JSON contract when auth is missing', async () => {
  const scorableHandlers = createScorableMatchesHttpHandlers();
  const playoffHandlers = createPlayoffHttpHandlers();

  const cases = [
    {
      name: 'GET /api/me/scorable-matches',
      run: () => scorableHandlers.list(
        new Request('https://fremontderby.com/api/me/scorable-matches'),
        {},
      ),
    },
    {
      name: 'POST /api/admin/seasons/:id/start-playoffs',
      run: () => playoffHandlers.start(
        new Request('https://fremontderby.com/api/admin/seasons/season-1/start-playoffs', {
          method: 'POST',
        }),
        {},
        'season-1',
      ),
    },
    {
      name: 'POST /api/admin/seasons/:id/advance-championship',
      run: () => playoffHandlers.advance(
        new Request('https://fremontderby.com/api/admin/seasons/season-1/advance-championship', {
          method: 'POST',
        }),
        {},
        'season-1',
      ),
    },
  ];

  for (const item of cases) {
    const response = await item.run();
    assert.equal(response.status, 401, item.name);
    assert.equal(response.headers.get('cache-control'), 'no-store', item.name);
    assert.deepEqual(await response.json(), missingAuthShape, item.name);
  }
});
