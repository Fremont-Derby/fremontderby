import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { friendlyErrorMessage } from '../src/appShell.js';

test('error popup script preserves whitespace regex (does not strip letter s)', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  const start = src.indexOf('const errorPopupScript');
  assert.ok(start >= 0);
  const chunk = src.slice(start, start + 4000);
  // Source must double-escape so the template literal emits \s to the browser.
  assert.match(chunk, /replace\(\/\\\\s\+\//);
  // Evaluate the template the same way the module does for a minimal fragment.
  const emitted = new Function(`return \`const value = String(x).replace(/\\\\s+/g, ' ').trim();\`;`)();
  assert.match(emitted, /\\s\+/);
  assert.doesNotMatch(emitted, /replace\(\/s\+\//);
});

test('friendly messages keep normal product text intact', () => {
  assert.equal(
    friendlyErrorMessage('Score changed on another phone'),
    'Score changed on another phone',
  );
  assert.equal(
    friendlyErrorMessage('Team name is required'),
    'Team name is required',
  );
});

test('database and infrastructure errors map to a stable human sentence', () => {
  const msg = friendlyErrorMessage(
    'Supabase request failed with 500: column reference "team_id" is ambiguous',
  );
  assert.match(msg, /could not complete that action/i);
  assert.doesNotMatch(msg, /ambiguous|Supabase|column/i);
});
