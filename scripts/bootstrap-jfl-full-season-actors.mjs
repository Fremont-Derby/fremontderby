import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { waitForExactJflHealth } from './reset-jfl-two-captain.mjs';

const project = 'oqkkvqkerusepyokzbmt';
const endpoint = `https://api.supabase.com/v1/projects/${project}/database/query`;
const readbackSql = `select count(*)::int as actor_count
  from generate_series(1,8) i
  join auth.users u on u.id = ('36430000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid
  join jfl.players p on p.id = ('36430000-2000-4000-8000-' || lpad(i::text,12,'0'))::uuid and p.user_id=u.id
  join jfl_private.player_contacts c on c.player_id=p.id
  where u.email = 'full-season-captain-' || i || '@jfl.persona.invalid'
    and u.aud='authenticated' and u.role='authenticated'
    and u.banned_until='infinity'::timestamptz
    and u.raw_app_meta_data='{"persona_fixture":true,"issue":3645}'::jsonb
    and coalesce(u.encrypted_password,'')='' and coalesce(u.phone,'')=''
    and u.email_confirmed_at is null and u.phone_confirmed_at is null
    and u.last_sign_in_at is null and u.deleted_at is null
    and coalesce(u.raw_user_meta_data,'{}'::jsonb)='{}'::jsonb
    and p.display_name='TEST Full-season Captain ' || i
    and c.phone='+120655501' || (30+i)::text
    and not exists(select 1 from auth.identities ai where ai.user_id=u.id)
    and not exists(select 1 from auth.sessions s where s.user_id=u.id);`;

export async function bootstrapFullSeasonActors({ env = process.env, fetchImpl = fetch, waitForHealth = waitForExactJflHealth, sql } = {}) {
  if (env.GITHUB_REPOSITORY !== 'Fremont-Derby/fremontderby'
    || env.GITHUB_REF !== 'refs/heads/fremontderby-jfl' || env.GITHUB_ACTOR !== 'subiki'
    || env.GITHUB_JOB !== 'reset-fixture' || !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '')) {
    throw new Error('Refusing full-season bootstrap outside the trusted JFL reset job');
  }
  if (!env.SUPABASE_ACCESS_TOKEN) throw new Error('Trusted staging Management API credential is unavailable');
  try { await waitForHealth({ fetchImpl, expectedSha: env.GITHUB_SHA }); }
  catch { throw new Error('Full-season bootstrap preflight failed; no SQL attempted'); }

  async function query(query, readOnly) {
    let response;
    try {
      response = await fetchImpl(endpoint, { method: 'POST', headers: { authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ query, read_only: readOnly }), signal: AbortSignal.timeout(60_000) });
    } catch { throw new Error('Full-season bootstrap transport failed; write outcome may be unknown, inspect before continuing'); }
    if (response.status !== 201) throw new Error(`Full-season bootstrap ${readOnly ? 'read' : 'write'} returned HTTP ${response.status}; no automatic replay`);
    const body = await response.json().catch(() => null);
    if (!Array.isArray(body) || body.some(row => row?.error)) throw new Error('Full-season bootstrap returned invalid data; no automatic replay');
    return body;
  }

  // Even an idempotent SQL script must be freshly qualified. Never assume a
  // matching user count proves private player/contact/credential boundaries.
  const fixture = sql ?? await readFile(new URL('./seed-jfl-full-season-actors.sql', import.meta.url), 'utf8');
  await query(fixture, false);
  const rows = await query(readbackSql, true);
  if (rows.length !== 1 || rows[0]?.actor_count !== 8) throw new Error('Full-season actor readback failed; do not enable personas');
  return { actorCount: 8, project, expectedSha: env.GITHUB_SHA };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  bootstrapFullSeasonActors().then(result => console.log(`PASS: eight non-login JFL actor/player/contact mappings at ${result.expectedSha}; persona feature stays disabled.`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
