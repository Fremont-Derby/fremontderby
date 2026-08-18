import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStampSha } from '../scripts/resolveStampSha.mjs';

test('prefers GITHUB_SHA over WORKERS_CI_COMMIT_SHA and DEPLOY_GIT_SHA', () => {
  assert.equal(
    resolveStampSha(
      {
        GITHUB_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        WORKERS_CI_COMMIT_SHA: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        DEPLOY_GIT_SHA: 'cccccccccccccccccccccccccccccccccccccccc',
      },
      () => 'dddddddddddddddddddddddddddddddddddddddd',
    ),
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  );
});

test('uses WORKERS_CI_COMMIT_SHA when GITHUB_SHA absent', () => {
  assert.equal(
    resolveStampSha(
      { WORKERS_CI_COMMIT_SHA: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
      () => 'dddddddddddddddddddddddddddddddddddddddd',
    ),
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  );
});

test('uses DEPLOY_GIT_SHA when higher-priority env vars absent', () => {
  assert.equal(
    resolveStampSha(
      { DEPLOY_GIT_SHA: 'cccccccccccccccccccccccccccccccccccccccc' },
      () => 'dddddddddddddddddddddddddddddddddddddddd',
    ),
    'cccccccccccccccccccccccccccccccccccccccc',
  );
});

test('falls back to git HEAD when env is empty', () => {
  assert.equal(
    resolveStampSha({}, () => 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'),
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  );
});

test('returns empty string when no valid SHA is available', () => {
  assert.equal(resolveStampSha({ GITHUB_SHA: 'not-a-sha' }, () => ''), '');
  assert.equal(resolveStampSha({}, () => 'short'), '');
});

test('accepts short 7-char hex SHAs', () => {
  assert.equal(resolveStampSha({ GITHUB_SHA: 'abc1234' }, () => ''), 'abc1234');
});
