export function dateStatusLabel(match) {
  return match && match.scheduledOn ? 'Night ' + match.scheduledOn : 'Date is not set';
}
