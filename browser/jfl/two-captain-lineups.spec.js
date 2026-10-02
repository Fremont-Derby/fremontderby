import { test, expect } from '@playwright/test';

const fixture = {
  roundId: '18580000-1200-4000-8000-000000000001',
  teamMatchId: '18580000-1300-4000-8000-000000000001',
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
  const teamId = await page.locator('[data-team-select]').inputValue();
  const opponent = await page.locator('[data-opponent-lineup-label]').textContent();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if ((await page.locator('[data-slot-count]').textContent()) !== '3 / 3') {
      for (const playerId of players) {
        await page.locator(`[data-toggle-player="${playerId}"]`).click();
      }
    }
    await expect(page.locator('[data-slot-count]')).toHaveText('3 / 3');
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    await page.locator('[data-submit]:visible, [data-mobile-submit]:visible').click();
    await expect.poll(async () => {
      const selection = await page.locator('[data-own-selection-status]').first().textContent() || '';
      const status = await page.locator('[data-status]').textContent() || '';
      return /Submitted|Locked/.test(selection) || /Too many requests/.test(status);
    }).toBe(true);
    const selection = await page.locator('[data-own-selection-status]').first().textContent() || '';
    if (/Submitted|Locked/.test(selection)) return;
    const status = await page.locator('[data-status]').textContent() || '';
    const seconds = Number(status.match(/wait (\d+) seconds?/i)?.[1]);
    expect(seconds).toBeGreaterThan(0);
    await page.waitForTimeout((seconds + 1) * 1000);
    // Read back before retry: the POST may have succeeded and only its reload was throttled.
    await openOwnLineup(page, teamId, opponent, players[0]);
    const refreshed = await page.locator('[data-own-selection-status]').first().textContent() || '';
    if (/Submitted|Locked/.test(refreshed)) return;
  }
  throw new Error('Lineup did not submit after bounded UI retries');
}

async function openFirstRaceFromLineup(page, teamId) {
  await page.locator('[data-score-link]').click();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await expect.poll(async () => await page.locator('[data-filters]').isVisible()
      || /could not load your scoring options|too many requests/i.test(
        await page.locator('[data-status]').textContent() || '')).toBe(true);
    if (await page.locator('[data-filters]').isVisible()) break;
    const status = await page.locator('[data-status]').textContent() || '';
    const seconds = /too many requests/i.test(status)
      ? Number(status.match(/wait (\d+) seconds?/i)?.[1]) : 10;
    expect(seconds, status).toBeGreaterThan(0);
    await page.waitForTimeout((seconds + 1) * 1000);
    await page.getByRole('link', { name: 'Try again' }).click();
  }
  await expect(page.locator('[data-filters]')).toBeVisible();
  await page.locator('[data-team]').selectOption(teamId);
  const dates = await page.locator('[data-date] option').evaluateAll((options) =>
    options.map((option) => option.value));
  let found = false;
  for (const date of dates) {
    await page.locator('[data-date]').selectOption(date);
    const matchups = await page.locator('[data-matchup] option').evaluateAll((options) =>
      options.map((option) => option.value));
    if (matchups.includes(fixture.teamMatchId)) {
      found = true;
      break;
    }
  }
  expect(found, 'fixed QA matchup is discoverable from the Score filters').toBe(true);
  await page.locator('[data-matchup]').selectOption(fixture.teamMatchId);
  const matchId = await page.locator('[data-race]').inputValue();
  expect(matchId).toBeTruthy();
  await page.locator('[data-list] a.match').click();
  await waitForScorecardReady(page);
  expect(new URL(page.url()).searchParams.get('team')).toBe(teamId);
  expect(await page.evaluate(() => window.fdRackLedgerAdapter.scoringTeamId())).toBe(teamId);
  expect(await page.evaluate(() => window.fdRackLedgerState.ownSide)).toBe(teamId === fixture.teamAId ? 'A' : 'B');
  return matchId;
}

async function waitForScorecardReady(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await expect.poll(async () => page.locator('[data-shared-rack-ledger-scorecard]')
      .getAttribute('data-load-state')).toMatch(/ready|unavailable/);
    if (await page.locator('[data-shared-rack-ledger-scorecard]').getAttribute('data-load-state') === 'ready') return;
    const detail = await page.locator('[data-load-detail]').textContent() || '';
    const seconds = Number(detail.match(/Wait (\d+) seconds?/i)?.[1]);
    expect(seconds, detail).toBeGreaterThan(0);
    await page.waitForTimeout((seconds + 1) * 1000);
    await page.reload();
  }
  throw new Error('Scorecard did not load after bounded UI retries');
}

async function scoreRack(page, winnerSide) {
  const priorCount = await page.evaluate(() => window.fdRackLedgerState.ownRackCount);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.locator('[data-add-rack]').click();
    await page.locator(`[data-rack-${winnerSide.toLowerCase()}]`).click();
    await expect.poll(async () => {
      const count = await page.evaluate(() => window.fdRackLedgerState.ownRackCount);
      const status = await page.locator('[data-status]').textContent() || '';
      return count === priorCount + 1 || /Wait before retrying/.test(status);
    }, { timeout: 30_000 }).toBe(true);
    const count = await page.evaluate(() => window.fdRackLedgerState.ownRackCount);
    if (count === priorCount + 1) return;
    const message = await page.locator('[data-error-message]').textContent() || '';
    const seconds = Number(message.match(/Wait (\d+) seconds?/i)?.[1]);
    expect(seconds, message).toBeGreaterThan(0);
    await page.waitForTimeout((seconds + 1) * 1000);
    // A successful POST can be followed by a throttled read. Reopen before replaying.
    await page.reload();
    await waitForScorecardReady(page);
    const refreshedCount = await page.evaluate(() => window.fdRackLedgerState.ownRackCount);
    if (refreshedCount === priorCount + 1) return;
    expect(refreshedCount).toBe(priorCount);
  }
  throw new Error('Rack did not save after bounded UI retries');
}

test('distinct captains blind-submit, reconcile scoring, and finalize the same JFL matchup', async ({ browser, request }) => {
  const health = await request.get('/health/environment');
  expect(health.ok()).toBeTruthy();
  const environment = await health.json();
  expect(environment).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true });
  if (process.env.PLAYWRIGHT_EXPECTED_SHA) {
    expect(environment.versionTag).toBe(process.env.PLAYWRIGHT_EXPECTED_SHA);
  }

  const contextA = await browser.newContext();
  // Keep the two roles isolated while proving the visiting captain can complete
  // the real lineup and scoring path on a phone-sized touch viewport.
  const contextB = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  try {
    const captainA = await contextA.newPage();
    const captainB = await contextB.newPage();
    await assumeCaptain(captainA, 'Admin Captain');
    await assumeCaptain(captainB, 'Regular Captain');
    expect(await captainB.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);
    expect(await captainB.evaluate(() => innerWidth)).toBeLessThanOrEqual(390);
    await openOwnLineup(captainA, fixture.teamAId, 'Persona Test Team B', fixture.teamAPlayers[0]);
    await openOwnLineup(captainB, fixture.teamBId, 'Persona Test Team A', fixture.teamBPlayers[0]);

    await expect(captainA.locator('[data-own-selection-status]').first()).toContainText('Not submitted');
    await expect(captainB.locator('[data-own-selection-status]').first()).toContainText('Not submitted');
    await expect(captainA.locator('[data-opponent]')).toBeHidden();
    await expect(captainB.locator('[data-opponent]')).toBeHidden();
    await expect(captainA.locator('[data-score-link]')).toBeHidden();
    await expect(captainB.locator('[data-score-link]')).toBeHidden();

    await chooseAndSubmit(captainA, fixture.teamAPlayers);
    await expect(captainA.locator('[data-own-selection-status]').first()).toContainText('Submitted');
    await openOwnLineup(captainB, fixture.teamBId, 'Persona Test Team A', fixture.teamBPlayers[0]);
    await expect(captainB.locator('[data-opponent-lineup-status]')).toHaveText('Submitted');
    await expect(captainB.locator('[data-opponent]')).toBeHidden();
    await expect(captainB.locator('[data-opponent-body]')).toBeEmpty();
    await expect(captainB.locator('[data-score-link]')).toBeHidden();

    await chooseAndSubmit(captainB, fixture.teamBPlayers);
    await expect(captainB.locator('[data-own-selection-status]').first()).toContainText('Locked');
    await expect(captainB.locator('[data-opponent]')).toBeVisible();
    await expect(captainB.locator('[data-opponent-body] .opponent-row')).toHaveCount(3);
    await expect(captainB.locator('[data-score-link]')).toBeVisible();

    await openOwnLineup(captainA, fixture.teamAId, 'Persona Test Team B', fixture.teamAPlayers[0]);
    await expect(captainA.locator('[data-own-selection-status]').first()).toContainText('Locked');
    await expect(captainA.locator('[data-opponent-body] .opponent-row')).toHaveCount(3);
    await expect(captainA.locator('[data-score-link]')).toBeVisible();

    const matchA = await openFirstRaceFromLineup(captainA, fixture.teamAId);
    const matchB = await openFirstRaceFromLineup(captainB, fixture.teamBId);
    expect(matchB).toBe(matchA);
    await expect(captainA.locator('[data-finalize]')).toBeDisabled();
    await expect(captainB.locator('[data-finalize]')).toBeDisabled();

    await scoreRack(captainA, 'A');
    await scoreRack(captainB, 'B');
    await expect(captainA.locator('[data-reconcile]')).toHaveAttribute('data-state', 'mismatch', { timeout: 30_000 });
    await expect(captainB.locator('[data-reconcile]')).toHaveAttribute('data-state', 'mismatch');
    await expect(captainA.locator('[data-reconcile-title]')).toContainText('Mismatch at rack 1');
    await expect(captainB.locator('[data-reconcile-title]')).toContainText('Mismatch at rack 1');
    await expect(captainA.locator('[data-finalize]')).toBeDisabled();
    await expect(captainB.locator('[data-finalize]')).toBeDisabled();

    await captainB.locator('[data-ledger] .rack-edit[data-edit-rack="1"]').click();
    await expect(captainB.locator('[data-edit-panel]')).toBeVisible();
    await captainB.locator('[data-edit-result="L"]').click();
    await expect(captainB.locator('[data-reconcile]')).toHaveAttribute('data-state', 'match');
    await expect(captainA.locator('[data-reconcile]')).toHaveAttribute('data-state', 'match', { timeout: 30_000 });

    const targetA = Number(await captainA.locator('[data-target-a]').textContent());
    expect(targetA).toBeGreaterThan(1);
    expect(targetA).toBeLessThanOrEqual(15);
    for (let rack = 2; rack <= targetA; rack += 1) {
      // A real rack takes longer than the JFL edge's observed ten-second throttle window.
      await captainA.waitForTimeout(12_000);
      await scoreRack(captainA, 'A');
      await scoreRack(captainB, 'A');
    }
    await expect(captainA.locator('[data-confirm]')).toBeEnabled();
    await expect(captainB.locator('[data-confirm]')).toBeEnabled();
    await expect(captainA.locator('[data-finalize]')).toBeDisabled();
    await captainA.locator('[data-confirm]').click();
    await expect.poll(async () => captainA.evaluate(() => window.fdRackLedgerState.ownConfirmed)).toBe(true);
    await expect(captainB.locator('[data-finalize]')).toBeDisabled();
    await captainB.locator('[data-confirm]').click();
    await expect.poll(async () => captainB.evaluate(() => window.fdRackLedgerState.ownConfirmed)).toBe(true);
    await expect(captainB.locator('[data-finalize]')).toBeEnabled();
    await captainB.locator('[data-finalize]').click();
    await expect(captainB.locator('[data-race-status]')).toHaveText('finalized');
    await captainA.reload();
    await captainB.reload();
    await expect(captainA.locator('[data-race-status]')).toHaveText('finalized');
    await expect(captainB.locator('[data-race-status]')).toHaveText('finalized');
    await expect(captainA.locator('[data-score-a]')).toHaveText(String(targetA));
    await expect(captainB.locator('[data-score-a]')).toHaveText(String(targetA));
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
