import { fileURLToPath } from 'node:url';

const DEPLOY_SOURCE = Object.freeze({
  main: 'production',
  'fremontderby-gamma': 'gamma',
  'fremontderby-jfl': 'jfl',
  'fremontderby-dru': 'dru',
});

export function assertDeploySource(refName, lane) {
  const ref = String(refName || '').trim();
  const requestedLane = String(lane || '').trim();
  if (!ref) throw new Error('Deploy source check failed: GITHUB_REF_NAME is missing.');
  if (!requestedLane) throw new Error('Deploy source check failed: lane input is missing.');

  const expectedLane = DEPLOY_SOURCE[ref];
  if (!expectedLane) {
    throw new Error(`Refusing deploy from untrusted ref "${ref}".`);
  }
  if (requestedLane !== expectedLane) {
    throw new Error(
      `Refusing ${requestedLane} deploy from "${ref}"; this ref may deploy only "${expectedLane}".`,
    );
  }
  return { ref, lane: requestedLane };
}

const isDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  try {
    const result = assertDeploySource(process.env.GITHUB_REF_NAME, process.env.DEPLOY_LANE);
    console.log(`Deploy source verified: ${result.ref} -> ${result.lane}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
