import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { renderScorePickerPage, scorePickerRetryAfterSeconds } from '../src/scorePickerPage.js';

function response(status, body = {}, retryAfter = null) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => name === 'retry-after' ? retryAfter : null },
    json: async () => body,
  };
}

async function renderWithResponses(scoreResponse, teamResponse) {
  const nodes = new Map();
  const element = () => ({
    dataset: {},
    children: [],
    addEventListener() {},
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
  });
  for (const selector of ['[data-status]', '[data-list]', '[data-filters]', '[data-date]',
    '[data-team]', '[data-matchup]', '[data-race]']) nodes.set(selector, element());
  const removed = [];
  const context = {
    URLSearchParams,
    location: { search: '' },
    sessionStorage: {
      getItem: () => 'test-session',
      removeItem: (key) => removed.push(key),
    },
    document: {
      querySelector: (selector) => nodes.get(selector),
      createElement: () => element(),
    },
    fetch: async (path) => path.includes('scorable-matches') ? scoreResponse : teamResponse,
  };
  const script = renderScorePickerPage().match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  vm.runInNewContext(script, context);
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { nodes, removed };
}

test('Score picker retry timing accepts seconds and HTTP dates with a bounded fallback', () => {
  const now = Date.parse('2026-10-02T21:00:00Z');
  assert.equal(scorePickerRetryAfterSeconds('10', now), 10);
  assert.equal(scorePickerRetryAfterSeconds('2026-10-02T21:00:30Z', now), 30);
  assert.equal(scorePickerRetryAfterSeconds('500', now), 120);
  assert.equal(scorePickerRetryAfterSeconds(null, now), 15);
  assert.equal(scorePickerRetryAfterSeconds('not a date', now), 15);
});

test('Score picker shows the throttle wait from either authorized read without clearing the session', async () => {
  for (const [score, team] of [
    [response(429, {}, '10'), response(200)],
    [response(200, { matches: [] }), response(429, {}, '10')],
  ]) {
    const { nodes, removed } = await renderWithResponses(score, team);
    assert.match(nodes.get('[data-status]').textContent, /Wait 10 seconds before trying again/);
    const card = nodes.get('[data-list]').children[0];
    assert.equal(card.children[0].textContent, 'Score is temporarily busy');
    assert.match(card.children[1].textContent, /Wait 10 seconds, then use Try again/);
    assert.equal(card.children[2].children[0].textContent, 'Try again');
    assert.deepEqual(removed, []);
  }
});

test('Score picker retains signed-out recovery for a 401', async () => {
  const { nodes, removed } = await renderWithResponses(response(401), response(200));
  assert.match(nodes.get('[data-status]').textContent, /sign-in expired/i);
  assert.deepEqual(removed, ['fd.accessToken']);
});
