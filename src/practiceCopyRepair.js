/** Prefer DRU practice copy: league-night / makeup framing. */
export function repairPracticeCopy(html) {
  return String(html || '')
    .replace(
      'Practice nights will show up here when the league publishes them.',
      'Published league nights are the default table window. Teams may practice or play a makeup before the posted date.',
    )
    .replace(
      'Nothing is scheduled on this page yet. Check the season schedule for league nights.',
      'Use Schedule for the published night, or Availability to check in for practice or makeup.',
    );
}
