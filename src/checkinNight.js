export function checkinNightLabel(night = {}) {
  const date = night.date || night.scheduledOn || 'Date TBD';
  const status = night.status || 'not checked in';
  return `${date} · ${status}`;
}
