import { buildFargoExportRecord } from './fargoExport.js';

export function toFargoFeed(matches = [], { generatedAt = new Date().toISOString() } = {}) {
  const items = matches.filter((match) => ['finalized', 'corrected'].includes(match.status)).map((match) => buildFargoExportRecord(match));
  return {
    feed: 'fremont-derby-fargo',
    acceptedByFargo: false,
    generatedAt,
    items,
  };
}
