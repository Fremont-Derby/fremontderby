// Test-only policy: a new explicit UI send is allowed only after a known
// rejection, a qualified wait and authoritative absence in both histories.
export function qualifiedSendWait(header, now = Date.now()) {
  const raw = String(header || '').trim();
  let seconds;
  if (/^\d+$/.test(raw)) seconds = Number(raw);
  else if (/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(raw)) {
    seconds = Math.ceil((Date.parse(raw) - now) / 1000);
  }
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60) throw new Error('Synthetic send Retry-After is unqualified');
  return seconds;
}

export async function sendWithQualifiedRecovery({ send, markerAbsent, wait, authorizeRetry, onResponse = () => {}, clock = Date.now }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await send();
    onResponse({ status: result.status, hasRetryAfter: Boolean(result.retryAfter) });
    // A successful/unconfirmed response or thrown network error never replays.
    if (result.status !== 429) return result;
    const seconds = qualifiedSendWait(result.retryAfter, clock());
    if (attempt === 2) throw new Error('Synthetic send rejection recovery exhausted');
    await wait((seconds + 1) * 1000);
    if (await markerAbsent() !== true) throw new Error('Synthetic send outcome requires cleanup, not another send');
    authorizeRetry();
  }
}
