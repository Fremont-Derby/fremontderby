export function lineupOrderLabel(names = []) {
  const clean = names.map((name) => String(name || '').trim()).filter(Boolean);
  return clean.length ? `Order: ${clean.join(', ')}` : '';
}
