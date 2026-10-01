import test from 'node:test';
import assert from 'node:assert/strict';
import { waiveDruTeamPayments } from '../src/druLineupBypass.js';

test('a DRU lineup lock can waive the practice roster', async () => {
  let posted = null;
  const count = await waiveDruTeamPayments({
    ENVIRONMENT: 'dru',
    SUPABASE_SCHEMA: 'dru',
    SUPABASE_URL: 'https://example.test',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
  }, { seasonId: 'season-1', teamId: 'team-1' }, async (url, init) => {
    if (String(url).includes('team_memberships')) {
      return new Response(JSON.stringify([{ player_id: 'p1' }]), { status: 200 });
    }
    posted = JSON.parse(init.body);
    return new Response('', { status: 201 });
  });
  assert.equal(count, 1);
  assert.equal(posted[0].status, 'waived');
  const skipped = await waiveDruTeamPayments({ ENVIRONMENT: 'gamma' }, { seasonId: 's', teamId: 't' });
  assert.equal(skipped, 0);
});
