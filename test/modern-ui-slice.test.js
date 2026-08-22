import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MODERN_UI_PROOF_PATH,
  getModernUiMode,
  decorateModernUiSliceResponse,
} from '../src/modernUiSlice.js';

const jflEnv = {
  ENVIRONMENT: 'jfl',
  CF_VERSION_METADATA: { id: 'version-jfl-123' },
};

function htmlResponse(body = '<!doctype html><html><body><main>Legacy rules</main></body></html>') {
  return new Response(body, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

test('JFL proof route defaults to the modern presentation', () => {
  const request = new Request(`https://jfl.fremontderby.com${MODERN_UI_PROOF_PATH}`);
  assert.equal(getModernUiMode(request, jflEnv), 'modern');
});

test('JFL non-allowlisted routes remain legacy', () => {
  const request = new Request('https://jfl.fremontderby.com/schedule');
  assert.equal(getModernUiMode(request, jflEnv), 'legacy');
});

test('non-JFL environments never enable the modern JFL slice', () => {
  for (const environment of ['production', 'gamma', 'dru', undefined]) {
    const request = new Request(`https://fremontderby.com${MODERN_UI_PROOF_PATH}`);
    assert.equal(getModernUiMode(request, { ENVIRONMENT: environment }), 'legacy');
  }
});

test('visible JFL fallback can force the proof route back to legacy', () => {
  const request = new Request(`https://jfl.fremontderby.com${MODERN_UI_PROOF_PATH}?ui=legacy`);
  assert.equal(getModernUiMode(request, jflEnv), 'legacy');
});

test('modern proof response is visibly marked and carries safe JFL evidence', async () => {
  const request = new Request(`https://jfl.fremontderby.com${MODERN_UI_PROOF_PATH}`);
  const response = await decorateModernUiSliceResponse(htmlResponse(), request, jflEnv);
  const body = await response.text();

  assert.match(body, /data-fd-ui-mode="modern"/);
  assert.match(body, /JFL/);
  assert.match(body, /Modern UI preview/);
  assert.match(body, /View legacy/);
  assert.equal(response.headers.get('x-fremont-environment'), 'jfl');
  assert.equal(response.headers.get('x-fremont-ui-mode'), 'modern');
  assert.equal(response.headers.get('x-fremont-worker-version'), 'version-jfl-123');
});

test('legacy and non-allowlisted responses are not rewritten', async () => {
  const body = '<!doctype html><html><body><main>Legacy unchanged</main></body></html>';

  for (const request of [
    new Request(`https://jfl.fremontderby.com${MODERN_UI_PROOF_PATH}?ui=legacy`),
    new Request('https://jfl.fremontderby.com/schedule'),
    new Request(`https://fremontderby.com${MODERN_UI_PROOF_PATH}`),
  ]) {
    const env = request.url.includes('jfl.') ? jflEnv : { ENVIRONMENT: 'production' };
    const response = await decorateModernUiSliceResponse(htmlResponse(body), request, env);
    assert.equal(await response.text(), body);
    assert.equal(response.headers.get('x-fremont-ui-mode'), null);
  }
});
