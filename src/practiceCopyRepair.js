/** Prefer DRU practice copy: league-night / makeup framing. */
export function repairPracticeCopy(html) {
  let next = String(html || '');
  next = next.replace(
    'Practice nights will show up here when the league publishes them.',
    'Published league nights are the default table window. Teams may practice or play a makeup before the posted date.',
  );
  next = next.replace(
    'Nothing is scheduled on this page yet. Check the season schedule for league nights.',
    'Open Schedule for the posted night, or Availability to check in.',
  );
  return next;
}
