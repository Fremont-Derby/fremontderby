import { createHash } from 'node:crypto';

const baseUrl = 'https://oqkkvqkerusepyokzbmt.supabase.co/rest/v1/';
const seasonId = '18580000-1000-4000-8000-000000000000';
const expected = Array.from({ length: 7 }, (_, index) => {
  const suffix = String(index + 1).padStart(12, '0');
  return { id: `18580000-2000-4000-8000-${suffix}`, user_id: `18580000-0000-4000-8000-${suffix}` };
});
const expectedIds = expected.map(row => row.id);

// This mirrors the qualified STABLE is_season_chat_participant contract:
// active season registration OR any membership, including historical rows.
// Every read must prove it was complete; a truncated response cannot qualify
// an audience. No consent/message/data mutation or credential fallback exists.
export async function qualifyJflGeneralAudience({ fetchImpl = fetch, serviceRoleKey }) {
  if (!serviceRoleKey) throw new Error('JFL General audience qualification failed');
  try {
    async function rows(path) {
      const response = await fetchImpl(baseUrl + path, { method: 'GET', headers: {
        apikey: serviceRoleKey, authorization: `Bearer ${serviceRoleKey}`,
        'accept-profile': 'jfl', accept: 'application/json', prefer: 'count=exact',
        'range-unit': 'items', range: '0-99',
      } });
      if (!response.ok) throw new Error();
      const result = await response.json();
      const range = response.headers.get('content-range') || '';
      const match = /^(?:0-(\d+)|\*)\/(\d+)$/.exec(range);
      if (!Array.isArray(result) || !match || Number(match[2]) !== result.length
        || result.length > 100 || (result.length ? Number(match[1]) !== result.length - 1 : match[1] !== undefined)) throw new Error();
      return result;
    }
    const seasons = await rows(`seasons?id=eq.${seasonId}&select=id,purpose`);
    if (seasons.length !== 1 || seasons[0].id !== seasonId || seasons[0].purpose !== 'qa') throw new Error();
    const registrations = await rows(`season_players?season_id=eq.${seasonId}&status=eq.active&select=player_id`);
    // Deliberately no status filter: a former member can still read General.
    const memberships = await rows(`team_memberships?season_id=eq.${seasonId}&select=player_id`);
    const audience = [...new Set([...registrations, ...memberships].map(row => row.player_id))].sort();
    if (JSON.stringify(audience) !== JSON.stringify(expectedIds)) throw new Error();
    const players = await rows(`players?id=in.(${expectedIds.join(',')})&select=id,user_id&order=id.asc`);
    if (players.length !== expected.length || players.some((row, index) => row.id !== expected[index].id
      || row.user_id !== expected[index].user_id)) throw new Error();
    return { audienceCount: audience.length, audienceDigest: createHash('md5').update(audience.join(',')).digest('hex') };
  } catch {
    // Response bodies and transport errors may contain private data or keys.
    throw new Error('JFL General audience qualification failed');
  }
}
