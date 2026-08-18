import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const doc = readFileSync(resolve(root, 'docs/cloudflare-builds-isolation.md'), 'utf8');

test('cloudflare-builds-isolation.md requires npm run deploy for Workers Builds (#1192)', () => {
  assert.match(doc, /npm run deploy/, 'must recommend npm run deploy so tagging and lane routing run');
  assert.match(doc, /Do \*\*not\*\* use plain `npx wrangler deploy`/, 'must forbid plain wrangler deploy');
  assert.match(doc, /WORKERS_CI_COMMIT_SHA|versionTag/, 'must reference tagging path');
  assert.match(doc, /#1192|#1222/, 'must link the tracking cards');
});
