export function messageRead({ read, sent }) {
  if (!read) return 'Read the message before you send it.';
  if (!sent) return 'Send the message you just read.';
  return 'The message was read and sent.';
}
