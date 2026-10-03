export function rackAdvance({ before, after, edited }) {
  if (edited) return { text: 'An edit recomputes the race. The next rack stays locked until both sides match.' };
  if (after <= before) return { text: 'A rack win must advance the score before the next rack unlocks.' };
  return { text: 'The score advanced. The next rack can unlock.' };
}

export function lineupLock({ home, away }) {
  if (!home || !away) return { locked: false, text: 'Both captains must submit before the lineup locks.' };
  return { locked: true, text: 'Both lineups are locked.' };
}
