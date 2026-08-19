import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDeployVersionTag } from '../src/deployVersionTag.js';

test('priority: cf_metadata.tag wins over env, stamp, and version id', () => {
  const result = resolveDeployVersionTag({
    meta: { tag: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', id: 'uuid-1', timestamp: '2026-01-01T00:00:00.000Z' },
    deployGitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    stampedSha: 'cccccccccccccccccccccccccccccccccccccccc',
    stampedAt: '2026-01-02T00:00:00.000Z',
  });
  assert.equal(result.tag, 'a'.repeat(40));
  assert.equal(result.versionTagSource, 'cf_metadata');
  assert.equal(result.deployedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(result.version, 'uuid-1');
});

test('priority: DEPLOY_GIT_SHA wins when metadata.tag is empty', () => {
  const result = resolveDeployVersionTag({
    meta: { tag: '  ', id: 'uuid-2' },
    deployGitSha: 'dddddddddddddddddddddddddddddddddddddddd',
    stampedSha: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  });
  assert.equal(result.tag, 'd'.repeat(40));
  assert.equal(result.versionTagSource, 'DEPLOY_GIT_SHA');
});

test('priority: stamped source wins when meta tag and env are absent', () => {
  const result = resolveDeployVersionTag({
    meta: { id: 'uuid-3' },
    stampedSha: 'ffffffffffffffffffffffffffffffffffffffff',
    stampedAt: '2026-03-01T00:00:00.000Z',
  });
  assert.equal(result.tag, 'f'.repeat(40));
  assert.equal(result.versionTagSource, 'stamped_source');
  assert.equal(result.deployedAt, '2026-03-01T00:00:00.000Z');
});

test('priority: cf version id is last resort; local id is ignored', () => {
  const withId = resolveDeployVersionTag({
    meta: { id: '01234567-89ab-cdef-0123-456789abcdef' },
  });
  assert.equal(withId.tag, '01234567-89ab-cdef-0123-456789abcdef');
  assert.equal(withId.versionTagSource, 'cf_version_id');

  const local = resolveDeployVersionTag({ meta: { id: 'local' } });
  assert.equal(local.tag, null);
  assert.equal(local.versionTagSource, null);
  assert.equal(local.version, 'local');
});

test('empty inputs yield null tag and local version', () => {
  const result = resolveDeployVersionTag({});
  assert.deepEqual(result, {
    tag: null,
    versionTagSource: null,
    deployedAt: null,
    version: 'local',
  });
});
