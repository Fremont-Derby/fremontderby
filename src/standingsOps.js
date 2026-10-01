export function standingsMode(mode) {
  return { text: mode || 'Standings mode is missing.' };
}

export function oneCaptaincy(seasons) {
  const open = (seasons || []).filter((season) => season.captain);
  return { ok: open.length <= 1, text: open.length <= 1 ? 'One captaincy.' : 'This person is already a captain.' };
}

export function checkinBurst(requests) {
  return { ok: (requests || []).length <= 1, text: (requests || []).length <= 1 ? 'One check-in request.' : 'Too many check-in requests.' };
}

export function mockSeason(season) {
  return { ok: (season?.teams || []).length <= 2, text: (season?.teams || []).length <= 2 ? 'Mock season is small enough.' : 'Mock season has too many teams.' };
}

export function cloudflareHtml(body) {
  return { ok: !String(body || '').includes('<html'), text: String(body || '').includes('<html') ? 'Cloudflare returned a page, not data.' : 'Response is data.' };
}
