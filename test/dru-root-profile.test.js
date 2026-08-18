import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadJsonc(path) {
  const raw = readFileSync(path, 'utf8');
  let out = '';
  let i = 0;
  let inString = false;
  let quote = null;
  while (i < raw.length) {
    const c = raw[i];
    const next = raw[i + 1];
    if (inString) {
      out += c;
      if (c === '\\' && i + 1 < raw.length) {
        out += raw[i + 1];
        i += 2;
        continue;
      }
      if (c === quote) inString = false;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      i += 2;
      while (i < raw.length && raw[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i + 1 < raw.length && !(raw[i] === '*' && raw[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return JSON.parse(out);
}

test('DRU permanent-branch root profile is lane-safe under plain wrangler deploy (#1190)', () => {
  const w = loadJsonc(resolve(root, 'wrangler.jsonc'));

  assert.equal(w.name, 'fremontderby-dru');
  assert.equal(w.vars?.ENVIRONMENT, 'dru');
  assert.equal(w.vars?.SUPABASE_SCHEMA, 'dru');
  assert.equal(w.workers_dev, false);
  assert.equal(w.preview_urls, false);

  const routes = (w.routes || []).map((r) => r.pattern);
  assert.ok(routes.includes('dru.fremontderby.com'), 'root must route dru.fremontderby.com');
  assert.ok(!routes.includes('fremontderby.com'), 'root must not claim production apex');
  assert.ok(!routes.includes('www.fremontderby.com'), 'root must not claim production www');

  assert.notEqual(w.vars?.ENVIRONMENT, 'production');
  assert.notEqual(w.name, 'fremontderby');

  // Prefer secrets for project identity on the permanent branch (no production ref in root vars).
  assert.ok(
    !w.vars?.EXPECTED_SUPABASE_PROJECT_REF ||
      w.vars.EXPECTED_SUPABASE_PROJECT_REF !== 'cpiucsxlkicmlbvdvhww',
    'root must not hardcode the production Supabase project ref',
  );
});
