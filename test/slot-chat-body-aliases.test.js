import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
test('returning slot and chat accept body aliases', () => {
  const index = readFileSync(join(root, 'src/index.js'), 'utf8');
  const chat = readFileSync(join(root, 'src/chatHttp.js'), 'utf8');
  assert.match(index, /body\.response \?\? body\.decision/);
  assert.match(chat, /body\.client_message_id/);
});
