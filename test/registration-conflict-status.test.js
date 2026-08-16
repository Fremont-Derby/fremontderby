import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/index.js'), 'utf8');

test('statusForError maps registration uniqueness messages to 409', () => {
  assert.match(src, /Player already has an active team membership.*return 409/s);
  assert.match(src, /already have a team application in this season.*return 409/s);
  assert.match(src, /Season is not open for team applications.*return 409/s);
  assert.match(src, /That team name is already used in this season.*return 409/s);
  assert.match(src, /Trade blocked: player still has an active team membership.*return 409/s);
});
