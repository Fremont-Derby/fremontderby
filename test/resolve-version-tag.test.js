import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVersionTag } from '../src/resolveVersionTag.js';

test('prefers CF metadata tag over all other sources', () => {
  const r = resolveVersionTag({
    meta: { tag: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', id: 'cf-id-1', timestamp: '2026-01-01T00:00:00Z' },
    deployGitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    stampedSha: 'cccccccccccccccccccccccccccccccccccccccc',
  });
  assert.equal(r.versionTag, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(r.versionTagSource, 'cf_metadata');
  assert.equal(r.deployedAt, '2026-01-01T00:00:00Z');
});

test('falls back to DEPLOY_GIT_SHA when metadata tag is empty', () => {
  const r = resolveVersionTag({
    meta: { tag: '', id: 'cf-id-2' },
    deployGitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    stampedSha: 'cccccccccccccccccccccccccccccccccccccccc',
  });
  assert.equal(r.versionTag, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  assert.equal(r.versionTagSource, 'DEPLOY_GIT_SHA');
});

test('falls back to stamped source when CF tag and DEPLOY_GIT_SHA are absent', () => {
  const r = resolveVersionTag({
    meta: {},
    deployGitSha: null,
    stampedSha: 'cccccccccccccccccccccccccccccccccccccccc',
    stampedAt: '2026-02-02T00:00:00Z',
  });
  assert.equal(r.versionTag, 'cccccccccccccccccccccccccccccccccccccccc');
  assert.equal(r.versionTagSource, 'stamped_source');
  assert.equal(r.deployedAt, '2026-02-02T00:00:00Z');
});

test('falls back to CF version id when nothing else is set', () => {
  const r = resolveVersionTag({
    meta: { id: 'version-uuid-xyz' },
  });
  assert.equal(r.versionTag, 'version-uuid-xyz');
  assert.equal(r.versionTagSource, 'cf_version_id');
  assert.equal(r.version, 'version-uuid-xyz');
});

test('ignores local CF version id and returns null tag', () => {
  const r = resolveVersionTag({
    meta: { id: 'local' },
  });
  assert.equal(r.versionTag, null);
  assert.equal(r.versionTagSource, null);
  assert.equal(r.version, 'local');
});

test('returns null versionTag when no sources are present', () => {
  const r = resolveVersionTag({});
  assert.equal(r.versionTag, null);
  assert.equal(r.versionTagSource, null);
  assert.equal(r.deployedAt, null);
  assert.equal(r.version, 'local');
});
