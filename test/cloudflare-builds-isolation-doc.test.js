import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isolationDoc = readFileSync(resolve(root, 'docs/cloudflare-builds-isolation.md'), 'utf8');
const actionsDoc = readFileSync(resolve(root, 'docs/GITHUB_ACTIONS.md'), 'utf8');

test('cloudflare-builds-isolation.md requires lane-specific deploy scripts (#1192)', () => {
  assert.match(isolationDoc, /npm run deploy:dru/, 'must recommend deploy:dru for the DRU project');
  assert.match(isolationDoc, /npm run deploy:jfl/, 'must recommend deploy:jfl for the JFL project');
  assert.match(isolationDoc, /npm run deploy:gamma/, 'must recommend deploy:gamma for the Gamma project');
  assert.match(isolationDoc, /npm run deploy:production/, 'must recommend deploy:production for production');
  assert.match(isolationDoc, /Do \*\*not\*\* use plain `npx wrangler deploy`/, 'must forbid plain wrangler deploy');
  assert.match(isolationDoc, /Do \*\*not\*\* use generic `npm run deploy` on lane projects/, 'must forbid generic deploy on lanes');
  assert.match(isolationDoc, /WORKERS_CI_COMMIT_SHA|versionTag/, 'must reference tagging path');
  assert.match(isolationDoc, /#1192|#1222/, 'must link the tracking cards');
});

test('GITHUB_ACTIONS.md requires the same lane-specific Workers Builds commands (#1192)', () => {
  assert.match(actionsDoc, /npm run deploy:dru/);
  assert.match(actionsDoc, /npm run deploy:jfl/);
  assert.match(actionsDoc, /npm run deploy:gamma/);
  assert.match(actionsDoc, /npm run deploy:production/);
  assert.match(actionsDoc, /npx wrangler deploy/);
  assert.match(actionsDoc, /#1192|#1222/);
});
