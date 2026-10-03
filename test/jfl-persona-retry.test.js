import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../browser/jfl/persona.js', import.meta.url), 'utf8')
  .replace(/^import[^\n]+\n/, '').replace('export async function', 'async function');

function harness(getStatuses, postStatuses = [200], retryAfter = '10', flapBanner = false, delayNavigation = false) {
  let observer;
  let navigationObserver;
  let control = false;
  let banner = '';
  const delays = [];
  let reloads = 0;
  let bannerChecks = 0;
  let pendingNavigation = null;
  const response = (status, method = 'GET') => ({
    status: () => status,
    url: () => 'https://jfl.fremontderby.com/api/test-persona',
    headers: () => ({ 'retry-after': retryAfter }),
    request: () => ({ method: () => method }),
  });
  const page = {
    on: (event, callback) => { if (event === 'response') observer = callback; else navigationObserver = callback; },
    off: (event, callback) => {
      if (event === 'response') { assert.equal(observer, callback); observer = undefined; }
      else { assert.equal(navigationObserver, callback); navigationObserver = undefined; }
    },
    mainFrame: () => 'main',
    waitForLoadState: async (state) => { assert.equal(state, 'domcontentloaded'); },
    goto: async () => {},
    reload: async () => {
      reloads += 1;
      const status = getStatuses.shift() ?? 200;
      control = status === 200;
      observer(response(status));
      navigationObserver('main');
    },
    waitForTimeout: async (duration) => { delays.push(duration); },
    locator: (selector) => ({
      isVisible: async () => selector === '[data-google-sign-in]' ? true
        : selector === '[data-test-persona-select]' ? control
          : Boolean(banner) && (!flapBanner || ++bannerChecks % 2 === 1),
      click: async () => {},
      textContent: async () => banner,
      selectOption: async ({ label }) => {
        const status = postStatuses.shift() ?? 200;
        observer(response(status, 'POST'));
        if (status === 200) {
          banner = label;
          if (delayNavigation) pendingNavigation = () => navigationObserver('main');
          else navigationObserver('main');
        }
      },
    }),
  };
  const expect = (value) => ({
    not: { toBeNull: () => assert.notEqual(value, null) },
    toContainText: async (text) => assert.ok((await value.textContent()).includes(text)),
  });
  expect.poll = (predicate) => ({
    toBe: async (value) => {
      let actual = await predicate();
      if (actual !== value && pendingNavigation) {
        pendingNavigation();
        pendingNavigation = null;
        actual = await predicate();
      }
      assert.equal(actual, value, 'setup predicate failed');
    },
  });
  const context = vm.createContext({ expect, console: { info: () => {} }, URL, Number, Math });
  vm.runInContext(source, context);
  return { run: () => context.assumePersona(page, 'Player A'), delays,
    reloads: () => reloads, navigationReady: () => pendingNavigation === null,
    cleaned: () => observer === undefined && navigationObserver === undefined };
}

test('persona GET throttle honors cooldown and verifies identity after UI retry', async () => {
  const state = harness([429, 200]);
  const result = await state.run();
  assert.equal(result.retries, 1);
  assert.deepEqual(state.delays, [11_000]);
  assert.equal(state.reloads(), 2);
  assert.equal(state.cleaned(), true);
});

test('persona reload does not invalidate an already-observed identity predicate', async () => {
  const state = harness([200], [200], '10', true);
  const result = await state.run();
  assert.equal(result.retries, 0);
  assert.deepEqual(state.delays, []);
  assert.equal(state.cleaned(), true);
});

test('persona setup waits for the successful switch document, not an old matching banner', async () => {
  const state = harness([200], [200], '10', false, true);
  const result = await state.run();
  assert.equal(result.retries, 0);
  assert.equal(state.navigationReady(), true);
  assert.equal(state.cleaned(), true);
});

test('persona switch throttle retries through reload rather than overriding identity', async () => {
  const state = harness([200, 200], [429, 200], '1');
  const result = await state.run();
  assert.equal(result.retries, 1);
  assert.deepEqual(state.delays, [2000]);
  assert.equal(state.cleaned(), true);
});

test('persona authorization denial is not treated as throttling', async () => {
  for (const status of [401, 403, 500]) {
    const state = harness([status]);
    await assert.rejects(state.run(), /setup predicate failed/);
    assert.deepEqual(state.delays, []);
    assert.equal(state.reloads(), 1);
    assert.equal(state.cleaned(), true);
  }
});

test('persona recovery refuses to shorten a cooldown beyond its bounded budget', async () => {
  const state = harness([429], [200], '120');
  await assert.rejects(state.run(), /exceeds the bounded setup budget/);
  assert.deepEqual(state.delays, []);
  assert.equal(state.cleaned(), true);
});

test('persona throttle recovery is bounded and observers are removed on exhaustion', async () => {
  const state = harness([429, 429, 429, 429], [200], '1');
  await assert.rejects(state.run(), /remained throttled/);
  assert.deepEqual(state.delays, [2000, 2000, 2000]);
  assert.equal(state.reloads(), 4);
  assert.equal(state.cleaned(), true);
});
