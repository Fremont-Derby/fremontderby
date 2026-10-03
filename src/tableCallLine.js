export function tableCallLine(call) {
  const value = String(call || '').trim();
  return value ? `Call: ${value}` : 'Call not set';
}
