const QA_RESULT_UX_STYLES = `
  .qa-progress{
    margin:8px 0 12px;
    padding:9px 11px;
    border-radius:10px;
    background:#f1f4f2;
    color:#425047;
    font-size:.78rem;
    font-weight:850;
  }
  .qa-progress[data-complete="true"]{
    background:#eaf7ef;
    color:#075f36;
  }
  .qa-assertion[data-answered="false"]{
    border-left:4px solid #c99d15;
    padding-left:9px;
  }
  .qa-assertion[data-answered="true"]{
    border-left:4px solid transparent;
    padding-left:9px;
  }
  .qa-save:disabled{
    background:#e7ebe8!important;
    border-color:#c8cfca!important;
    color:#5f6762!important;
    -webkit-text-fill-color:#5f6762!important;
    opacity:1!important;
    cursor:not-allowed;
  }
  .qa-result{
    min-height:0!important;
    margin:10px 0 0!important;
    padding:0;
  }
  .qa-result[data-visible="true"]{
    display:block;
    padding:14px;
    border:2px solid #17241d;
    border-radius:12px;
    font-size:.92rem!important;
    line-height:1.35;
  }
  .qa-result[data-outcome="pass"]{
    border-color:#08783f;
    background:#eaf7ef;
    color:#075f36;
  }
  .qa-result[data-outcome="fail"]{
    border-color:#9b2c2c;
    background:#fff1f1;
    color:#7c2020;
  }
  .qa-next[data-qa-next-ready="false"]{display:none!important}
  .qa-next[data-qa-next-ready="true"]{display:flex!important}
`;

const QA_RESULT_UX_SCRIPT = String.raw`
<script>
(() => {
  const assertionRows = Array.from(document.querySelectorAll('.qa-assertion'));
  const assertionButtons = Array.from(document.querySelectorAll('[data-qa-assertion]'));
  const save = document.querySelector('[data-qa-save]');
  const result = document.querySelector('[data-qa-result]');
  const actions = document.querySelector('.qa-actions');
  const next = document.querySelector('.qa-next');
  if (!assertionRows.length || !save || !result || !actions) return;

  const intro = document.querySelector('.qa-assertions > p');
  const progress = document.createElement('div');
  progress.className = 'qa-progress';
  progress.dataset.qaProgress = 'true';
  progress.setAttribute('role', 'status');
  progress.setAttribute('aria-live', 'polite');
  intro?.after(progress);

  actions.before(result);
  result.dataset.visible = 'false';
  if (next) next.dataset.qaNextReady = 'false';

  function answerFor(index) {
    return assertionButtons.find((button) => button.dataset.qaAssertion === String(index) && button.getAttribute('aria-pressed') === 'true');
  }

  function syncCompletion() {
    let answered = 0;
    assertionRows.forEach((row, index) => {
      const done = Boolean(answerFor(index));
      row.dataset.answered = String(done);
      if (done) answered += 1;
    });
    const total = assertionRows.length;
    const remaining = total - answered;
    const complete = remaining === 0;
    progress.dataset.complete = String(complete);
    progress.textContent = complete
      ? total + ' of ' + total + ' answered · ready to finish.'
      : answered + ' of ' + total + ' answered · ' + remaining + ' remaining.';
    save.disabled = !complete;
    save.textContent = complete
      ? 'Finish level'
      : 'Answer ' + remaining + ' remaining check' + (remaining === 1 ? '' : 's');
  }

  for (const button of assertionButtons) {
    button.addEventListener('click', () => requestAnimationFrame(syncCompletion));
  }

  save.addEventListener('click', () => {
    requestAnimationFrame(() => {
      if (!result.textContent.trim()) return;
      result.dataset.visible = 'true';
      const failed = result.dataset.outcome === 'fail';
      result.textContent = failed
        ? 'MISSION FAILED — feedback saved. A failed mission is a valid result.'
        : 'MISSION PASSED ✓ — feedback saved.';
      save.disabled = true;
      save.textContent = 'Result saved';
      if (next) next.dataset.qaNextReady = 'true';
      result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  syncCompletion();
})();
</script>`;

export async function enhanceQaResultUx(response, request, env = {}) {
  if (!response || env.ENVIRONMENT !== 'jfl') return response;
  const url = new URL(request.url);
  if (url.pathname !== '/qa/scorecard/play') return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  if (!html.includes('data-qa-save') || !html.includes('data-qa-assertion')) {
    return new Response(html, response);
  }

  const enhanced = html
    .replace('</head>', `<style>${QA_RESULT_UX_STYLES}</style></head>`)
    .replace('</body>', `${QA_RESULT_UX_SCRIPT}</body>`);
  return new Response(enhanced, response);
}
