import { expect } from '@playwright/test';

export async function expectLaneIdentity(request) {
  const expectedEnvironment = process.env.PLAYWRIGHT_EXPECTED_ENVIRONMENT || 'jfl';
  const response = await request.get('/health/environment');

  expect(response.ok(), 'lane health endpoint should return HTTP 200').toBeTruthy();
  const health = await response.json();
  expect(health.environment).toBe(expectedEnvironment);
  expect(health.versionTag).toEqual(expect.any(String));
  expect(health.versionTag.length).toBeGreaterThan(0);

  return health;
}
