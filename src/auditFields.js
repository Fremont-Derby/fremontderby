export function auditFields({ actor, reason, before, after }) {
  if (!actor || !reason || before == null || after == null) return { ok: false, text: 'A privileged change needs an actor, a time, a reason, and the before and after.' };
  return { ok: true, text: 'The privileged change records the actor, reason, and before and after.' };
}

export function canaryStatus({ ok }) {
  if (!ok) return { text: 'The public surface did not answer. Check the lane, then try the page again.' };
  return { text: 'The public surface answered.' };
}
