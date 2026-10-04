export function tableLine(tableNumber) {
  const value = String(tableNumber || '').trim();
  return value ? `Table ${value}` : 'Table not set';
}
