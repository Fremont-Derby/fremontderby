export function safeError({ kind, reference }) {
  const ref = reference ? ` Reference ${reference}.` : '';
  if (kind === 'permission') return { tone: 'denied', text: `You cannot do that.${ref} Open Profile if you need a different role.` };
  if (kind === 'stale') return { tone: 'stale', text: `This page is out of date.${ref} Refresh, then try again.` };
  if (kind === 'validation') return { tone: 'fix', text: `Check the highlighted field.${ref}` };
  return { tone: 'failed', text: `That did not save.${ref} Try again, or write it down and enter it later.` };
}
