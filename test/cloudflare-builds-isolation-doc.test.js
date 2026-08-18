import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const doc = readFileSync(resolve(root, 'docs/cloudflare-builds-isolation.md'), 'utf8');

test('cloudflare-builds-isolation.md requires lane-specific deploy scripts (#1192)', () => {
  assert.match(doc, /npm run deploy:dru/, 'must recommend deploy:dru for the DRU project');
  assert.match(doc, /npm run deploy:jfl/, 'must recommend deploy:jfl for the JFL project');
  assert.match(doc, /npm run deploy:gamma/, 'must recommend deploy:gamma for the Gamma project');
  assert.match(doc, /npm run deploy:production/, 'must recommend deploy:production for production');
  assert.match(doc, /Do \*\*not\*\* use plain `npx wrangler deploy`/, 'must forbid plain wrangler deploy');
  assert.match(doc, /Do \*\*not\*\* use generic `npm run deploy` on lane projects/, 'must forbid generic deploy on lanes');
  assert.match(doc, /WORKERS_CI_COMMIT_SHA|versionTag/, 'must reference tagging path');
  assert.match(doc, /#1192|#1222/, 'must link the tracking cards');
});
