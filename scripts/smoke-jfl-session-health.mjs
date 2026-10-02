import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { JFL_SIMULATED_GOOGLE_TOKEN } from '../src/supabaseAuth.js';

export const JFL_SESSION_URL = 'https://jfl.fremontderby.com/api/me/teams';

export async function verifyJflSessionHealth(fetchImpl = fetch) {
  const response = await fetchImpl(JFL_SESSION_URL, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${JFL_SIMULATED_GOOGLE_TOKEN}`,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200) {
    throw new Error(`JFL simulated session health returned HTTP ${response.status}; expected 200.`);
  }
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error('JFL simulated session health did not return JSON.');
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('JFL simulated session health returned invalid JSON.');
  }
  const state = body?.teamManagement;
  if (!state || !Array.isArray(state.captain_teams) || !Array.isArray(state.invitations)) {
    throw new Error('JFL simulated session health is missing team management state.');
  }
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyJflSessionHealth();
  console.log('JFL simulated session and team bootstrap passed.');
}
