/**
 * Count node:test files under test/ and enforce a minimum floor so
 * accidental mass-deletion of season-1 coverage fails CI.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIN_TEST_FILES = 180;

export async function countTestFiles(testDir = 'test') {
  const entries = await readdir(testDir, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.test.js')).length;
}

export async function assertTestFileFloor(testDir = 'test', min = MIN_TEST_FILES) {
  const files = await countTestFiles(testDir);
  return { ok: files >= min, files, min };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirect) {
  const result = await assertTestFileFloor();
  console.log(JSON.stringify(result));
  if (!result.ok) {
    console.error(`Too few test files: ${result.files} < ${result.min}`);
    process.exit(1);
  }
  console.log('Test file floor OK');
}
