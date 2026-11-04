// Read-only preflight. This command never submits SQL or changes GitHub state.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectJflSqlReviewContext } from './lib/jfl-sql-review-context.mjs';

const repository = resolve(fileURLToPath(new URL('../',import.meta.url)));
const invoke = promisify(execFile);
const options = { cwd: repository, timeout: 15000, maxBuffer: 262144, windowsHide: true, encoding: 'utf8' };
async function main() {
  if (process.argv.length !== 4 || process.argv[2] !== '--manifest') throw new Error('JFL_SQL_REVIEWS_ARGUMENTS');
  const root = (await invoke('git',['rev-parse','--show-toplevel'],options)).stdout.trim();
  const normalized = path => process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path);
  if (normalized(root) !== normalized(repository)) throw new Error('JFL_SQL_REVIEWS_WORKSPACE');
  const remote = (await invoke('git',['remote','get-url','origin'],options)).stdout.trim();
  if (!['https://github.com/Fremont-Derby/fremontderby.git','git@github.com:Fremont-Derby/fremontderby.git'].includes(remote)) {
    throw new Error('JFL_SQL_REVIEWS_WORKSPACE');
  }
  const dirty = (await invoke('git',['status','--porcelain','--untracked-files=no'],options)).stdout.trim();
  if (dirty) throw new Error('JFL_SQL_REVIEWS_DIRTY_WORKTREE');
  const expectedSourceSha = (await invoke('git',['rev-parse','HEAD'],options)).stdout.trim();
  const manifestBytes = await readFile(process.argv[3]);
  const context = await collectJflSqlReviewContext({ manifestBytes, expectedSourceSha,
    readComment: async id => {
      const result = await invoke('gh',['api','--hostname','github.com',
        `repos/Fremont-Derby/fremontderby/issues/comments/${id}`],options);
      return JSON.parse(result.stdout);
    },
    readHealth: async url => {
      const response = await fetch(url,{ redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (response.status !== 200) throw new Error('HTTP_HEALTH_FAILURE');
      const body = await response.text();
      if (body.length > 65536) throw new Error('HEALTH_SIZE_FAILURE');
      return JSON.parse(body);
    },
  });
  console.log(JSON.stringify({ status: 'review-context-collected', executionAuthorized: false,
    sourceSha: context.reviewedSourceSha, approvalSha256: context.approvalSha256,
    healthObservedAt: context.health.observedAt }));
}
main().catch(error => {
  console.error(/^JFL_SQL_REVIEWS_[A-Z_]+$/.test(error.message) ? error.message : 'JFL_SQL_REVIEWS_FAILED');
  process.exitCode = 1;
});
