/**
 * Micro-benchmark: rpcErrorStatus phrase wall + path match split vs regex.
 * Run: node scripts/bench-rpc-error-status.mjs
 */
import { rpcErrorStatus } from '../src/rpcErrorStatus.js';
import { matchApiTeamsPath, matchApiTeamsPathRegex } from '../src/pathMatch.js';

const messages = [
  'Only the active captain can do that',
  'You already have a team application in this season',
  'Season not found',
  'Cannot regenerate player matches after scoring has started for this team match',
  'Supabase request failed with 400: duplicate key value violates unique constraint',
  'Request failed',
  'Active roster membership is required',
  'Player match not found',
];

const paths = [
  '/api/teams/019e24c3-fbba-4554-8924-6c964fc41548/messages',
  '/api/teams/019e24c3-fbba-4554-8924-6c964fc41548/chat',
  '/api/teams/019e24c3-fbba-4554-8924-6c964fc41548/messages/read',
  '/api/teams/019e24c3-fbba-4554-8924-6c964fc41548/membership-request',
  '/api/teams/ready-checks',
  '/api/seasons/x/messages',
];

function bench(label, fn, n) {
  const t0 = performance.now();
  let sink = 0;
  for (let i = 0; i < n; i++) sink += fn(i) ? 1 : 0;
  const ms = performance.now() - t0;
  return { label, ms, n, sink, perIterUs: (ms * 1000) / n };
}

const N = 50_000;

const rpc = bench(
  'rpcErrorStatus',
  (i) => rpcErrorStatus(new Error(messages[i % messages.length])),
  N,
);

const split = bench(
  'matchApiTeamsPath (split)',
  (i) => matchApiTeamsPath(paths[i % paths.length]),
  N,
);

const regex = bench(
  'matchApiTeamsPathRegex',
  (i) => matchApiTeamsPathRegex(paths[i % paths.length]),
  N,
);

for (const row of [rpc, split, regex]) {
  console.log(
    `${row.label}: ${row.ms.toFixed(2)} ms / ${row.n} iters (${row.perIterUs.toFixed(3)} µs/op)`,
  );
}
console.log(
  `path split vs regex speedup: ${(regex.ms / split.ms).toFixed(2)}x (higher is better for split)`,
);


// Simulate router style: try several team path regexes in sequence (historical shape).
const teamRegexes = [
  /^\/api\/teams\/([^/]+)\/(?:messages|chat|team-messages)$/,
  /^\/api\/teams\/([^/]+)\/messages\/read$/,
  /^\/api\/teams\/([^/]+)\/membership-request$/,
  /^\/api\/teams\/ready-checks$/,
];
function matchApiTeamsPathRegexCascade(pathname) {
  for (const re of teamRegexes) {
    const m = pathname.match(re);
    if (m) return m;
  }
  return null;
}

const cascade = bench(
  'matchApiTeamsPathRegex cascade (4)',
  (i) => matchApiTeamsPathRegexCascade(paths[i % paths.length]),
  N,
);
console.log(
  `${cascade.label}: ${cascade.ms.toFixed(2)} ms / ${cascade.n} iters (${cascade.perIterUs.toFixed(3)} µs/op)`,
);
console.log(
  `split vs 4-regex cascade: ${(cascade.ms / split.ms).toFixed(2)}x`,
);
