import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyJflGeneralAudience } from '../scripts/qualify-jfl-general-audience.mjs';

const season = '18580000-1000-4000-8000-000000000000';
const players = Array.from({ length: 7 }, (_, i) => ({ id: '18580000-2000-4000-8000-' + String(i + 1).padStart(12, '0'),
  user_id: '18580000-0000-4000-8000-' + String(i + 1).padStart(12, '0') }));
function fixture(change = () => {}) {
  const calls = [];
  const data = { seasons: [{ id: season, purpose: 'qa' }], season_players: players.slice(0, 3).map(p => ({ player_id: p.id })),
    team_memberships: players.slice(2).map(p => ({ player_id: p.id })), players: structuredClone(players) };
  change(data);
  return { calls, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    const name = new URL(url).pathname.split('/').pop();
    const rows = data[name];
    const headers = { 'content-type': 'application/json', 'content-range': rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0' };
    return new Response(JSON.stringify(rows), { headers });
  } };
}
test('complete union qualifies historical-only recipients and exact fixed user mappings using GET only', async () => {
  const f = fixture();
  assert.deepEqual(await qualifyJflGeneralAudience({ ...f, serviceRoleKey: 'synthetic-key' }),
    { audienceCount: 7, audienceDigest: '81bb1f6cccaaf5125ec546abaa5b4065' });
  assert.equal(f.calls.length, 4);
  for (const { url, options } of f.calls) {
    assert.equal(options.method, 'GET');
    assert.equal(new URL(url).host, 'oqkkvqkerusepyokzbmt.supabase.co');
    assert.equal(options.headers['accept-profile'], 'jfl');
    assert.equal(options.headers.prefer, 'count=exact');
  }
  assert.equal(new URL(f.calls[2].url).searchParams.has('status'), false);
});
for (const [name, change] of [
  ['real-season purpose', d => { d.seasons[0].purpose = 'league'; }],
  ['wrong season', d => { d.seasons[0].id = 'other'; }],
  ['unknown historical member', d => { d.team_memberships.push({ player_id: 'unknown' }); }],
  ['missing audience member', d => { d.team_memberships.pop(); }],
  ['missing player mapping', d => { d.players.pop(); }],
  ['unexpected user mapping', d => { d.players[0].user_id = 'unknown'; }],
  ['duplicate player mapping', d => { d.players[1] = d.players[0]; }],
  ['malformed membership', d => { d.team_memberships.push({}); }],
]) test(`fails closed for ${name}`, async () => {
  await assert.rejects(qualifyJflGeneralAudience({ ...fixture(change), serviceRoleKey: 'synthetic-key' }),
    { message: 'JFL General audience qualification failed' });
});
for (const [name, response] of [
  ['unknown count', () => new Response('[]', { headers: { 'content-range': '*/\u002a' } })],
  ['truncated range', () => new Response('[{}]', { headers: { 'content-range': '0-0/101' } })],
  ['missing range', () => new Response('[]')],
  ['HTML error', () => new Response('<html>synthetic-private</html>', { status: 429 })],
  ['invalid JSON', () => new Response('synthetic-private', { headers: { 'content-range': '0-0/1' } })],
  ['network secret', () => { throw new Error('synthetic-key synthetic-private'); }],
]) test(`does not retry or leak private data for ${name}`, async () => {
  let calls = 0;
  await assert.rejects(qualifyJflGeneralAudience({ serviceRoleKey: 'synthetic-key', fetchImpl: async () => { calls++; return response(); } }),
    { message: 'JFL General audience qualification failed' });
  assert.equal(calls, 1);
});
test('missing credential performs no request', async () => {
  await assert.rejects(qualifyJflGeneralAudience({ fetchImpl: () => assert.fail('must not request') }),
    { message: 'JFL General audience qualification failed' });
});
