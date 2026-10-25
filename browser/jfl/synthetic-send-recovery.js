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

// Conversation starts already use a server-enforced unique season/player pair.
// Before a known-rejected new UI start, both authenticated inboxes must agree:
// the same exact mutually writable conversation, or no conversation on either.
export function qualifyConversationReadback(senderRows, recipientRows, fixture) {
  const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
  if (!fixture || ![fixture.season, fixture.sender, fixture.recipient].every(uuid)
    || fixture.sender === fixture.recipient) throw new Error('Synthetic conversation identities are unqualified');
  for (const rows of [senderRows, recipientRows]) {
    if (!Array.isArray(rows) || rows.some(row => !row || !uuid(row.conversation_id)
      || !uuid(row.season_id) || !uuid(row.other_player_id) || typeof row.can_send !== 'boolean')) {
      throw new Error('Synthetic conversation inbox readback is malformed');
    }
  }
  const outgoing = senderRows.filter(row => row.season_id === fixture.season && row.other_player_id === fixture.recipient);
  const incoming = recipientRows.filter(row => row.season_id === fixture.season && row.other_player_id === fixture.sender);
  if (!outgoing.length && !incoming.length) return null;
  if (outgoing.length !== 1 || incoming.length !== 1 || outgoing[0].conversation_id !== incoming[0].conversation_id
    || outgoing[0].can_send !== true || incoming[0].can_send !== true) {
    throw new Error('Synthetic conversation inboxes do not agree on one writable target');
  }
  return outgoing[0].conversation_id;
}
