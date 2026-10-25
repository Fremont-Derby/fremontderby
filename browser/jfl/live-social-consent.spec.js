import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';

// #3575: the trusted live-fixture job already supplies this opt-in and exact
// deployment SHA. Public PRs must never mutate hosted persona preferences.
test.skip(process.env.PLAYWRIGHT_LIVE_SEASON_READBACK !== '1',
  'Live persona preferences are exercised only by the trusted JFL fixture job.');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const channels = [
  { key: 'general', prefix: 'social-general', path: '/api/me/social-chat-consent/general', field: 'enabled' },
  { key: 'team', prefix: 'social-team', path: '/api/me/social-chat-consent/team', field: 'enabled' },
  { key: 'direct', prefix: 'dm', path: '/api/me/direct-message-consent', field: 'directMessages' },
];
const readThrottles = new WeakMap();

async function cooldown(page, response) {
  expect(response.status(), 'Only observed HTTP429 permits recovery').toBe(429);
  const header = response.headers()['retry-after'];
  const numeric = header?.trim() ? Number(header) : NaN;
  const parsed = Number.isFinite(numeric) ? numeric : Math.ceil((Date.parse(header) - Date.now()) / 1000);
  const seconds = Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 15;
  expect(seconds, 'Excessive Retry-After must fail closed').toBeLessThanOrEqual(60);
  console.info(`Live consent HTTP429 recovery; cooldown=${seconds + 1}s.`);
  await page.waitForTimeout((seconds + 1) * 1000);
}

async function read(page, channel) {
  const reload = page.locator(`[data-${channel.prefix}-consent-reload]`);
  const toggle = page.locator(`[data-${channel.prefix}-consent-toggle]`);
  // Use the page's confirmed state instead of manufacturing extra GETs. A fresh
  // navigation already loads every channel through the production controller.
  const priorThrottle = readThrottles.get(page)?.get(channel.path);
  if (priorThrottle) {
    readThrottles.get(page).delete(channel.path);
    await cooldown(page, priorThrottle);
  }
  await expect.poll(async () => await toggle.isEnabled() || await reload.isEnabled()).toBe(true);
  if (await toggle.isEnabled()) return toggle.isChecked();
  for (let attempt = 0; attempt < 4; attempt++) {
    await expect(reload).toBeEnabled();
    const pending = page.waitForResponse(response => new URL(response.url()).pathname === channel.path
      && response.request().method() === 'GET');
    await reload.click();
    const response = await pending;
    if (response.status() === 429) {
      expect(attempt, 'Consent read recovery exhausted').toBeLessThan(3);
      await cooldown(page, response);
      continue;
    }
    expect(response.status(), 'Consent read must succeed without bypass').toBe(200);
    const body = await response.json();
    expect(typeof body[channel.field]).toBe('boolean');
    await expect(page.locator(`[data-${channel.prefix}-consent-toggle]`)).toBeEnabled();
    return body[channel.field];
  }
  throw new Error('Consent read remained unavailable');
}

async function snapshot(page) {
  const values = {};
  for (const channel of channels) values[channel.key] = await read(page, channel);
  return values;
}

async function save(page, channel, desired) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await read(page, channel) === desired) return;
    await expect(page.locator('[data-test-persona-banner]')).toContainText('Admin Captain');
    await page.locator(`[data-${channel.prefix}-consent-toggle]`).setChecked(desired);
    const pending = page.waitForResponse(response => new URL(response.url()).pathname === channel.path
      && response.request().method() === 'PUT');
    await page.locator(`[data-${channel.prefix}-consent-save]`).click();
    const response = await pending;
    if (response.status() === 429) {
      // A rejected save locks the form. Recover an authoritative GET before any
      // new explicit selection/Save action; never replay an uncertain mutation.
      await expect(page.locator(`[data-${channel.prefix}-consent-status]`)).toContainText('Could not confirm');
      await expect(page.locator(`[data-${channel.prefix}-consent-save]`)).toBeDisabled();
      await cooldown(page, response);
      if (await read(page, channel) === desired) return;
      expect(attempt, 'Explicit consent save recovery exhausted').toBeLessThan(2);
      console.info('Rejected consent save reread; reselecting the intended value through Profile.');
      continue;
    }
    expect(response.status(), 'Consent save must be confirmed').toBe(200);
    expect((await response.json())[channel.field]).toBe(desired);
    expect(await read(page, channel)).toBe(desired);
    return;
  }
}

for (const [device, viewport] of [['phone', { width: 320, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
  test(`live three-channel consent persists independently and original values are restored (${device})`, async ({ browser, request }) => {
    const sha = process.env.PLAYWRIGHT_EXPECTED_SHA || '';
    expect(sha).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(await health.json()).toMatchObject({ ok: true, environment: 'jfl',
      expectedSupabaseSchema: 'jfl', versionTag: sha });
    const context = await browser.newContext({ viewport, isMobile: device === 'phone', hasTouch: device === 'phone' });
    const page = await context.newPage();
    readThrottles.set(page, new Map());
    page.on('response', response => {
      if (response.request().method() !== 'GET') return;
      const path = new URL(response.url()).pathname;
      if (!channels.some(channel => channel.path === path)) return;
      if (response.status() >= 400) readThrottles.get(page).set(path, response);
      else if (response.ok()) readThrottles.get(page).delete(path);
    });
    let original;
    try {
      await assumePersona(page, 'Admin Captain');
      const identity = await page.evaluate(async () => {
        const response = await fetch('/api/test-persona', { headers: {
          authorization: 'Bearer ' + sessionStorage.getItem('fd.accessToken'),
        } });
        const body = await response.json();
        return { status: response.status, environment: body.environment, key: body.current?.key };
      });
      expect(identity).toEqual({ status: 200, environment: 'jfl', key: 'admin-captain' });
      original = await snapshot(page);
      for (const channel of channels) {
        const desired = { ...original, [channel.key]: !original[channel.key] };
        await save(page, channel, desired[channel.key]);
        expect(await snapshot(page)).toEqual(desired);
        await page.reload();
        await expect(page.locator('[data-test-persona-banner]')).toContainText('Admin Captain');
        expect(await snapshot(page)).toEqual(desired);
        await save(page, channel, original[channel.key]);
        expect(await snapshot(page)).toEqual(original);
      }
    } finally {
      try {
        if (original) {
          for (const channel of channels) await save(page, channel, original[channel.key]);
          expect(await snapshot(page), 'Synthetic persona original consent values restored').toEqual(original);
          console.info('Synthetic persona original consent values restored and verified.');
        }
      } finally {
        await context.close();
      }
    }
  });
}
