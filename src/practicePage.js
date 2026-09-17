export function renderPracticePage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Practice · Fremont Derby</title>
</head>
<body>
  <main class="app" data-fd-dru-practice="true">
    <header><h1>Practice</h1></header>
    <p>Published league nights are the default table window. Teams may practice or play a makeup before the posted date.</p>
    <p data-next-match>Your next published night is on Schedule. Use that date unless a captain posts a makeup.</p>
    <p><a href="/schedule">Schedule</a> · <a href="/availability">Check in</a> · <a href="/messages">Messages</a></p>
  </main>
</body>
</html>`;
}
