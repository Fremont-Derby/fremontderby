import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const JFL_SEASONS_URL = 'https://jfl.fremontderby.com/api/seasons';

export async function verifyJflSeasonBootstrap(fetchImpl = fetch) {
  const response = await fetchImpl(JFL_SEASONS_URL, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200) {
    throw new Error(`JFL public season bootstrap returned HTTP ${response.status}; expected 200.`);
  }
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error('JFL public season bootstrap did not return JSON.');
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('JFL public season bootstrap returned invalid JSON.');
  }
  if (!Array.isArray(body?.seasons)) {
    throw new Error('JFL public season bootstrap is missing the seasons array.');
  }
  return body.seasons.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const count = await verifyJflSeasonBootstrap();
  console.log(`JFL public season bootstrap passed (${count} seasons).`);
}
