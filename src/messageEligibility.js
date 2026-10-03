export function correctMessageLine(message = {}) {
  if (!message.text) return '';
  return `Sent: ${message.text}`;
}
export function eligibilityLine(check = {}) {
  const missing = [];
  if (!check.payment) missing.push('payment');
  if (!check.availability) missing.push('availability');
  if (missing.length) return `Not eligible: ${missing.join(' and ')} is missing.`;
  return 'Eligible: payment set and availability set.';
}
