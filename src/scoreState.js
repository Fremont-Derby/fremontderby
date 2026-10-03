export function scoreState({ selectedSide, saving, saved, disputed, empty }) {
  if (empty) return { tone: 'empty', text: 'No race is open. Open the lineup, then come back to score.' };
  if (saving) return { tone: 'pending', text: 'Saving the selected side.' };
  if (disputed) return { tone: 'dispute', text: 'Captains disagree. This is not the race result.' };
  if (saved && selectedSide) return { tone: 'saved', text: `Saved side ${selectedSide}.` };
  if (selectedSide) return { tone: 'selected', text: `Selected side ${selectedSide}.` };
  return { tone: 'ready', text: 'Choose a side, then save the rack.' };
}
