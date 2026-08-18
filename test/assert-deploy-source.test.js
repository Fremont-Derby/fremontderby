import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDeploySource } from '../scripts/assert-deploy-source.mjs';

for (const [ref, lane] of [
  ['main', 'production'],
  ['fremontderby-gamma', 'gamma'],
  ['fremontderby-jfl', 'jfl'],
  ['fremontderby-dru', 'dru'],
]) {
  test(`${ref} may deploy only ${lane}`, () => {
    assert.deepEqual(assertDeploySource(ref, lane), { ref, lane });
  });
}

test('cross-lane deploys fail closed', () => {
  assert.throws(() => assertDeploySource('fremontderby-jfl', 'production'), /may deploy only "jfl"/);
  assert.throws(() => assertDeploySource('fremontderby-jfl', 'dru'), /may deploy only "jfl"/);
  assert.throws(() => assertDeploySource('fremontderby-dru', 'jfl'), /may deploy only "dru"/);
  assert.throws(() => assertDeploySource('fremontderby-gamma', 'production'), /may deploy only "gamma"/);
});

test('untrusted refs and missing inputs fail closed', () => {
  assert.throws(() => assertDeploySource('feature/example', 'jfl'), /untrusted ref/);
  assert.throws(() => assertDeploySource('', 'jfl'), /GITHUB_REF_NAME is missing/);
  assert.throws(() => assertDeploySource('fremontderby-jfl', ''), /lane input is missing/);
});
