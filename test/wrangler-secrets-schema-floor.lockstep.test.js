import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MIN_TEST_FILES, countTestFiles } from '../scripts/count-tests.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseJsonc(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

test('wrangler requires SUPABASE_SERVICE_ROLE_KEY secret at top-level and every lane', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.ok(
    Array.isArray(cfg.secrets?.required) && cfg.secrets.required.includes('SUPABASE_SERVICE_ROLE_KEY'),
    'top-level secrets.required must include SUPABASE_SERVICE_ROLE_KEY',
  );
  for (const lane of ['jfl', 'dru', 'gamma']) {
    const required = cfg.env?.[lane]?.secrets?.required || [];
    assert.ok(
      required.includes('SUPABASE_SERVICE_ROLE_KEY'),
      `env.${lane} secrets.required must include SUPABASE_SERVICE_ROLE_KEY`,
    );
  }
});

test('lane SUPABASE_SCHEMA matches lane name; production must not set a lane schema', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(
    cfg.vars?.SUPABASE_SCHEMA,
    undefined,
    'production must not declare SUPABASE_SCHEMA (uses public/default)',
  );
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(
      cfg.env[lane].vars?.SUPABASE_SCHEMA,
      lane,
      `${lane} SUPABASE_SCHEMA must equal lane name`,
    );
  }
});

test('wrangler declares compatibility_date and version_metadata binding', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.ok(typeof cfg.compatibility_date === 'string' && cfg.compatibility_date.length >= 10);
  assert.equal(cfg.version_metadata?.binding, 'CF_VERSION_METADATA');
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(
      cfg.env[lane].version_metadata?.binding,
      'CF_VERSION_METADATA',
      `${lane} must bind CF_VERSION_METADATA`,
    );
  }
});

test('MIN_TEST_FILES floor is enforced and currently satisfied', async () => {
  assert.ok(MIN_TEST_FILES >= 180, 'floor must stay at least 180');
  const files = await countTestFiles(join(root, 'test'));
  assert.ok(files >= MIN_TEST_FILES, `test file count ${files} must be >= ${MIN_TEST_FILES}`);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['test:floor'], 'node scripts/count-tests.mjs');
  assert.ok(existsSync(join(root, 'scripts/count-tests.mjs')));
});

test('package lint and prebuild keep their pure entrypoints', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.lint, 'node scripts/lint.mjs');
  assert.equal(pkg.scripts.prebuild, 'node scripts/guard-cloudflare-build.mjs');
  assert.ok(existsSync(join(root, 'scripts/lint.mjs')));
  assert.ok(existsSync(join(root, 'scripts/guard-cloudflare-build.mjs')));
});
