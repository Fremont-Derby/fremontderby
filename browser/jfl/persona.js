import { expect } from '@playwright/test';

// Retry only observed throttling, never authorization or missing-role failures.
// No bearer/session material leaves the browser or enters the test report.
export async function assumePersona(page, label) {
  let throttle = null;
  let retries = 0;
  let navigationEpoch = 0;
  let switchNavigation = null;
  const observeNavigation = (frame) => {
    if (frame === page.mainFrame()) navigationEpoch += 1;
  };
  const observe = (response) => {
    const path = new URL(response.url()).pathname;
    if (path === '/api/test-persona' && response.request().method() === 'POST'
      && response.status() >= 200 && response.status() < 300) switchNavigation = navigationEpoch;
    if (response.status() === 429 && (path === '/api/test-persona' || path === '/profile')) {
      const seconds = Number(response.headers()['retry-after']);
      throttle = Number.isFinite(seconds) && seconds > 0 ? seconds : 15;
    }
  };
  page.on('response', observe);
  page.on('framenavigated', observeNavigation);
  try {
    await page.goto('/profile');
    let didSignIn = false;
    const signIn = page.locator('[data-google-sign-in]');
    const selector = page.locator('[data-test-persona-select]');
    const banner = page.locator('[data-test-persona-banner]');
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let controlReady = false;
      await expect.poll(async () => {
        controlReady = await selector.isVisible();
        return controlReady || (!didSignIn && await signIn.isVisible()) || throttle !== null;
      }).toBe(true);
      if (!didSignIn && await signIn.isVisible()) {
        await signIn.click();
        didSignIn = true;
        await page.reload();
        await expect.poll(async () => {
          controlReady = await selector.isVisible();
          return controlReady || throttle !== null;
        }).toBe(true);
      }
      if (controlReady) {
        // An unrelated prior profile read may have throttled while this control
        // loaded successfully. Only a new switch failure triggers its retry.
        throttle = null;
        switchNavigation = null;
        await selector.selectOption({ label });
        let switched = false;
        await expect.poll(async () => {
          switched = switchNavigation !== null && navigationEpoch > switchNavigation
            && await banner.isVisible() && (await banner.textContent()).includes(label);
          return switched || throttle !== null;
        }).toBe(true);
        if (switched) {
          await page.waitForLoadState('domcontentloaded');
          await expect(banner).toContainText(label);
          return { retries };
        }
      }
      expect(throttle, 'Only an observed HTTP429 permits persona setup recovery').not.toBeNull();
      if (attempt === 3) break;
      const seconds = throttle;
      if (seconds > 60) throw new Error('Persona rate-limit cooldown exceeds the bounded setup budget');
      retries += 1;
      console.info(`Persona setup retry ${attempt + 1}/3 after HTTP429; cooldown=${seconds + 1}s.`);
      await page.waitForTimeout((seconds + 1) * 1000);
      throttle = null;
      await page.reload();
    }
    throw new Error('Persona setup remained throttled after bounded Profile retries');
  } finally {
    page.off('response', observe);
    page.off('framenavigated', observeNavigation);
  }
}
