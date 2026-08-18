import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
test('GET team practice is routed', () => {
  const index = readFileSync(join(root, 'src/index.js'), 'utf8');
  assert.match(index, /handleGetTeamPracticeRequest/);
  assert.match(index, /request\.method === \"GET\"/);
  const repo = readFileSync(join(root, 'src/teamRepository.js'), 'utf8');
  assert.match(repo, /async getTeamPractice/);
});
