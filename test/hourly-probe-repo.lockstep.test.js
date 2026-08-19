import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PROBE_GITHUB_REPO,
  DEFAULT_PROBE_ISSUE,
  maybeCommentProbeFailures,
  formatProbeMarkdown,
} from '../src/hourlyProbe.js';

test('hourly probe defaults to Fremont-Derby org and issue 806', () => {
  assert.equal(DEFAULT_PROBE_GITHUB_REPO, 'Fremont-Derby/fremontderby');
  assert.equal(DEFAULT_PROBE_ISSUE, '806');
});

test('maybeCommentProbeFailures posts to Fremont-Derby repo by default', async () => {
  const calls = [];
  const result = await maybeCommentProbeFailures(
    { HOURLY_PROBE_GITHUB_TOKEN: 'token' },
    {
      ok: false,
      checkedAt: '2026-08-18T00:00:00.000Z',
      reports: [],
      failures: [{ url: 'https://fremontderby.com/trades', status: 404 }],
    },
    {
      fetch: async (url, options) => {
        calls.push({ url, options });
        return new Response('{}', { status: 201 });
      },
    },
  );
  assert.equal(result.commented, true);
  assert.equal(result.repo, 'Fremont-Derby/fremontderby');
  assert.equal(result.issue, '806');
  assert.match(calls[0].url, /repos\/Fremont-Derby\/fremontderby\/issues\/806\/comments/);
  assert.ok(!/subiki/.test(calls[0].url));
});

test('formatProbeMarkdown still marks failures', () => {
  const md = formatProbeMarkdown({
    ok: false,
    checkedAt: '2026-08-18T00:00:00.000Z',
    reports: [{
      host: 'https://fremontderby.com',
      results: [{ url: 'https://fremontderby.com/trades', status: 404, ok: false, ms: 12 }],
      failures: [{ url: 'https://fremontderby.com/trades', status: 404, ok: false, ms: 12 }],
    }],
    failures: [{ url: 'https://fremontderby.com/trades', status: 404 }],
  });
  assert.match(md, /FAIL/);
  assert.match(md, /trades/);
});
