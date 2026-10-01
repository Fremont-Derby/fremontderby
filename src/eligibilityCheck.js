export function eligibilityCheck(player) {
  if (!player.paid) return { ok: false, reason: 'Payment is missing.' };
  if (!player.available) return { ok: false, reason: 'Availability is missing.' };
  return { ok: true, reason: 'Paid and available.' };
}
