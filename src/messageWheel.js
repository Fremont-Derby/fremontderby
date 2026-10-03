export function messageWheel({ overflow, delta }) {
  if (!overflow) return { scroll: false, text: 'The message list fits. The page can scroll.' };
  if (delta) return { scroll: true, text: 'The message list scrolls with the wheel.' };
  return { scroll: true, text: 'The message list can scroll.' };
}

export function adminSeasonEmpty() {
  return { text: 'No seasons yet. Open season setup.' };
}
