import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';
import { injectTestPersonaControls } from '../../src/testPersonaEnhancer.js';

// Exercise the real persona enhancer with synthetic state; no hosted APIs.
async function fixture(browser, { current = 'admin', throttle = null, wrongBanner = false } = {}) {
  const context = await browser.newContext({ baseURL: 'https://persona.test' });
  await context.addInitScript(() => {
    if (window === window.top) sessionStorage.setItem('fd.accessToken', 'synthetic-persona-test');
  });
  const labels = { admin: 'Admin Captain', regular: 'Regular Captain' };
  const posts = [], reads = [];
  let navigations = 0, reject = throttle !== null;
  await context.route('**/*', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/profile') {
      navigations++;
      const html = await (await injectTestPersonaControls(new Response('<!doctype html><body><main data-authenticated-content></main></body>',
        { headers: { 'content-type': 'text/html' } }))).text();
      return route.fulfill({ contentType: 'text/html', body: html });
    }
    expect(path).toBe('/api/test-persona');
    if (req.method() === 'POST') {
      posts.push(req.postDataJSON());
      current = req.postDataJSON().persona;
    } else {
      expect(req.method()).toBe('GET'); reads.push(path);
      if (reject) {
        reject = false;
        return route.fulfill({ status: 429, headers: throttle === 'missing' ? {} : { 'Retry-After': throttle === 'date' ? new Date(Date.now() + 10_000).toUTCString() : throttle }, json: {} });
      }
    }
    return route.fulfill({ json: { environment: 'jfl', current: { key: current, label: wrongBanner ? 'Different identity' : labels[current] },
      personas: Object.entries(labels).map(([key, label]) => ({ key, label })) } });
  });
  const page = await context.newPage();
  return { context, page, posts, reads, navigations: () => navigations };
}

test('confirmed current persona avoids a redundant switch and reload', async ({ browser }) => {
  const f = await fixture(browser);
  try {
    await assumePersona(f.page, 'Admin Captain');
    await expect(f.page.locator('[data-test-persona-banner]')).toContainText('Admin Captain');
    expect(f.posts).toEqual([]);
    expect(f.navigations()).toBe(1);
    expect(f.reads).toHaveLength(1);
  } finally { await f.context.close(); }
});

test('different persona still requires one confirmed switch and navigation', async ({ browser }) => {
  const f = await fixture(browser, { current: 'regular' });
  try {
    await assumePersona(f.page, 'Admin Captain');
    expect(f.posts).toEqual([{ persona: 'admin' }]);
    expect(f.navigations()).toBe(2);
    await expect(f.page.locator('[data-test-persona-select]')).toHaveValue('admin');
  } finally { await f.context.close(); }
});

test('selector alone cannot reuse an inconsistent current identity', async ({ browser }) => {
  const f = await fixture(browser, { wrongBanner: true });
  f.page.setDefaultTimeout(500);
  try {
    await expect(assumePersona(f.page, 'Admin Captain')).rejects.toThrow();
    expect(f.posts).toEqual([{ persona: 'admin' }]);
  } finally { await f.context.close(); }
});

for (const header of ['missing', '0', '-1', 'nonsense', '61']) {
  test(`persona throttle ${header} stops without a guessed retry`, async ({ browser }) => {
    const f = await fixture(browser, { throttle: header });
    try {
      await expect(assumePersona(f.page, 'Admin Captain')).rejects.toThrow(/Retry-After/);
      expect(f.navigations()).toBe(1);
      expect(f.posts).toEqual([]);
    } finally { await f.context.close(); }
  });
}

for (const header of ['1', 'date']) {
  test(`persona qualified throttle recovers through Profile: ${header === '1' ? 'seconds' : 'date'}`, async ({ browser }) => {
    const f = await fixture(browser, { throttle: header });
    // Virtualize only the validated cooldown; DOM and navigation stay real.
    const waits = [];
    f.page.waitForTimeout = async ms => { waits.push(ms); };
    try {
      const result = await assumePersona(f.page, 'Admin Captain');
      expect(result.retries).toBe(1);
      expect(waits).toHaveLength(1);
      expect(waits[0]).toBeGreaterThan(1000);
      expect(waits[0]).toBeLessThanOrEqual(61_000);
      expect(f.navigations()).toBe(2);
      expect(f.posts).toEqual([]);
    } finally { await f.context.close(); }
  });
}
