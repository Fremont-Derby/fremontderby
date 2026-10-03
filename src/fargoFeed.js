import { buildFargoExportRecord } from './fargoExport.js';

export function toFargoFeed(matches = [], { generatedAt = new Date().toISOString() } = {}) {
  const items = matches.filter((match) => ['finalized', 'corrected'].includes(match.status)).map((match) => ({ ...buildFargoExportRecord(match), sourceUrl: match.sourceUrl || `/api/fargo/feed?playerMatchId=${match.playerMatchId}`, reportStatus: 'not_sent' }));
  return {
    feed: 'fremont-derby-fargo',
    acceptedByFargo: false,
    generatedAt,
    items,
  };
}

export function feedForMatch(feed, playerMatchId) {
  if (!playerMatchId) return feed;
  const items = (feed.items || []).filter((item) => item.playerMatchId === playerMatchId);
  return { ...feed, items, found: items.length > 0 };
}
