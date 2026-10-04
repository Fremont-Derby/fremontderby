export function checkinRow(night = {}) {
  const date = night.date || 'Date TBD';
  const status = night.status || 'not checked in';
  return `${date} · ${status}`;
}
