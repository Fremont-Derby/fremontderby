import { test, expect } from '@playwright/test';

const fixture = {
  roundId: '18580000-1200-4000-8000-000000000001',
  teamAId: '18580000-1100-4000-8000-000000000001',
  teamBId: '18580000-1100-4000-8000-000000000002',
  teamAPlayers: [
    '18580000-2000-4000-8000-000000000002',
    '18580000-2000-4000-8000-000000000004',
    '18580000-2000-4000-8000-000000000006',
  ],
  teamBPlayers: [
    '18580000-2000-4000-8000-000000000003',
    '18580000-2000-4000-8000-000000000005',
    '18580000-2000-4000-8000-000000000007',
  ],
};

async function assumeCaptain(page, label) {
  await page.goto('/profile');
  await page.locator('[data-google-sign-in]').click();
  await page.reload();
  const selector = page.locator('[data-test-persona-select]');
  await expect(selector).toBeVisible();
  await selector.selectOption({ label });
  await expect(page.locator('[data-test-persona-banner]')).toContainText(label);
}

async function waitForCandidate(page, playerId) {
  const candidate = page.locator(`[data-toggle-player="${playerId}"]`);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await expect.poll(async () =>
      await candidate.isVisible()
      || /Too many requests/.test((await page.locator('[data-status]').textContent()) || ''),
    ).toBe(true);
    if (await candidate.isVisible()) return;
    const message = (await page.locator('[data-status]').textContent()) || '';
    const seconds = Number(message.match(/wait (\d+) seconds?/)?.[1]);
    expect(seconds).toBeGreaterThan(0);
    await page.waitForTimeout((seconds + 1) * 1000);
    await page.locator('[data-refresh]').click();
  }
  await expect(candidate).toBeVisible();
}

async function openOwnLineup(page, teamId, opposingTeamName, firstPlayerId) {
  await page.goto('/lineup');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await expect.poll(async () =>
      await page.locator('[data-workspace]').isVisible()
      || await page.locator('[data-gate-retry]').isVisible(),
    ).toBe(true);
    if (await page.locator('[data-workspace]').isVisible()) break;
    const detail = await page.locator('[data-gate-detail]').textContent();
    expect(detail).toMatch(/Too many requests\. Please wait \d+ seconds?/);
    const seconds = Number(detail.match(/wait (\d+) seconds?/)[1]);
    await page.waitForTimeout((seconds + 1) * 1000);
    await page.locator('[data-gate-retry]').click();
  }
  await expect(page.locator('[data-workspace]')).toBeVisible();
  await expect(page.locator('[data-team-select]')).toHaveValue(teamId);
  await expect(page.locator('[data-round-select]')).toHaveValue(fixture.roundId);
  await expect(page.locator('[data-opponent-lineup-label]')).toHaveText(opposingTeamName);
  await waitForCandidate(page, firstPlayerId);
}

async function chooseAndSubmit(page, players) {
  for (const playerId of players) {
    await page.locator(`[data-toggle-player="${playerId}"]`).click();
  }
  await expect(page.locator('[data-slot-count]')).toHaveText('3 / 3');
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    await dialog.accept();
  });
  await page.locator('[data-submit]').click();
}

test('distinct captains blind-submit, then reveal the same JFL matchup', async ({ browser, request }) => {
  const health = await request.get('/health/environment');
  expect(health.ok()).toBeTruthy();
  const environment = await health.json();
  expect(environment).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true });
  if (process.env.PLAYWRIGHT_EXPECTED_SHA) {
    expect(environment.versionTag).toBe(process.env.PLAYWRIGHT_EXPECTED_SHA);
  }

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    const captainA = await contextA.newPage();
    const captainB = await contextB.newPage();
    await assumeCaptain(captainA, 'Admin Captain');
    await assumeCaptain(captainB, 'Regular Captain');
    await openOwnLineup(captainA, fixture.teamAId, 'Persona Test Team B', fixture.teamAPlayers[0]);
    await openOwnLineup(captainB, fixture.teamBId, 'Persona Test Team A', fixture.teamBPlayers[0]);

    await expect(captainA.locator('[data-own-selection-status]').first()).toContainText('Not submitted');
    await expect(captainB.locator('[data-own-selection-status]').first()).toContainText('Not submitted');
    await expect(captainA.locator('[data-opponent]')).toBeHidden();
    await expect(captainB.locator('[data-opponent]')).toBeHidden();

    await chooseAndSubmit(captainA, fixture.teamAPlayers);
    await expect(captainA.locator('[data-own-selection-status]').first()).toContainText('Submitted');
    await openOwnLineup(captainB, fixture.teamBId, 'Persona Test Team A', fixture.teamBPlayers[0]);
    await expect(captainB.locator('[data-opponent-lineup-status]')).toHaveText('Submitted');
    await expect(captainB.locator('[data-opponent]')).toBeHidden();
    await expect(captainB.locator('[data-opponent-body]')).toBeEmpty();

    await chooseAndSubmit(captainB, fixture.teamBPlayers);
    await expect(captainB.locator('[data-own-selection-status]').first()).toContainText('Locked');
    await expect(captainB.locator('[data-opponent]')).toBeVisible();
    await expect(captainB.locator('[data-opponent-body] .opponent-row')).toHaveCount(3);
    await expect(captainB.locator('[data-score-link]')).toBeVisible();

    await openOwnLineup(captainA, fixture.teamAId, 'Persona Test Team B', fixture.teamAPlayers[0]);
    await expect(captainA.locator('[data-own-selection-status]').first()).toContainText('Locked');
    await expect(captainA.locator('[data-opponent-body] .opponent-row')).toHaveCount(3);
    await expect(captainA.locator('[data-score-link]')).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
