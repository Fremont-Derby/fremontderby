import { rackAttentionLine } from './rackAttentionLine.js';

export function renderNoticesPage() {
  const oneRack = rackAttentionLine(1);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Notices · Fremont Derby</title>
</head>
<body>
  <main>
    <h1>Notices</h1>
    <p>League notices are on the messages page.</p>
    <p>${oneRack}</p>
    <p><a href="/messages">Open messages</a></p>
  </main>
</body>
</html>`;
}
