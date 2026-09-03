import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUBLIC_HTML_PATHS,
  PUBLIC_JSON_PATHS,
  CANARY_HOSTS,
  HTML_SHELL_MARKERS,
} from '../scripts/public-surface-contract.mjs';
import { formatCanaryIncidentComment } from '../scripts/canary-incident-comment.mjs';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';

test('canary contract covers production, www, and every lane host', () => {
  const names = CANARY_HOSTS.map((host) => host.name);
  assert.deepEqual(names.sort(), ['dru', 'gamma', 'jfl', 'production', 'www'].sort());
  assert.equal(CANARY_HOSTS.find((host) => host.name === 'dru').expectEnv, 'dru');
  assert.equal(CANARY_HOSTS.find((host) => host.name === 'production').expectEnv, 'production');
});

test('canary HTML contract still includes playoffs and trades on every host', () => {
  assert.ok(PUBLIC_HTML_PATHS.includes('/playoffs'));
  assert.ok(PUBLIC_HTML_PATHS.includes('/trades'));
  assert.ok(PUBLIC_JSON_PATHS.includes('/health'));
  assert.ok(PUBLIC_JSON_PATHS.includes('/health/environment'));
  assert.ok(HTML_SHELL_MARKERS.includes('<!doctype html'));
});

test('production DNS guard covers apex and www only', () => {
  assert.deepEqual([...PRODUCTION_DNS_HOSTS], ['fremontderby.com', 'www.fremontderby.com']);
});

test('canary incident comment names host, kind, status, url, and error', () => {
  const body = formatCanaryIncidentComment({
    runUrl: 'https://github.com/Fremont-Derby/fremontderby/actions/runs/1',
    failed: [
      {
        host: 'dru',
        kind: 'html',
        status: 404,
        url: 'https://dru.fremontderby.com/playoffs',
        error: 'HTTP 404',
      },
    ],
  });
  assert.match(body, /dru/);
  assert.match(body, /playoffs/);
  assert.match(body, /HTTP 404/);
  assert.match(body, /#1183/);
  assert.match(body, /#2173/);
  assert.doesNotMatch(body, /Still failing: run /);
});
