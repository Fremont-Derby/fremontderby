import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVersionTag } from '../src/resolveVersionTag.js';

test('prefers CF metadata tag over all other sources', () => {
  const result = resolveVersionTag({
    meta: { tag: 'meta-sha', id: 'version-id' },
    deployGitSha: 'env-sha',
    stampedSha: 'stamp-sha',
  });
  assert.deepEqual(result, {
    versionTag: 'meta-sha',
    versionTagSource: 'cf_metadata',
  });
});

test('falls back to DEPLOY_GIT_SHA when metadata tag is empty', () => {
  const result = resolveVersionTag({
    meta: { tag: '  ', id: 'version-id' },
    deployGitSha: 'env-sha-40chars',
    stampedSha: 'stamp-sha',
  });
  assert.deepEqual(result, {
    versionTag: 'env-sha-40chars',
    versionTagSource: 'DEPLOY_GIT_SHA',
  });
});

test('falls back to stamped bundle SHA when env var absent', () => {
  const result = resolveVersionTag({
    meta: {},
    deployGitSha: null,
    stampedSha: 'stamp-sha-value',
  });
  assert.deepEqual(result, {
    versionTag: 'stamp-sha-value',
    versionTagSource: 'stamped_source',
  });
});

test('falls back to CF version id when nothing else is present', () => {
  const result = resolveVersionTag({
    meta: { id: 'cf-version-uuid' },
  });
  assert.deepEqual(result, {
    versionTag: 'cf-version-uuid',
    versionTagSource: 'cf_version_id',
  });
});

test('ignores local CF version id placeholder', () => {
  const result = resolveVersionTag({
    meta: { id: 'local' },
  });
  assert.deepEqual(result, {
    versionTag: null,
    versionTagSource: null,
  });
});

test('returns null when all sources are empty', () => {
  assert.deepEqual(resolveVersionTag({}), {
    versionTag: null,
    versionTagSource: null,
  });
});
