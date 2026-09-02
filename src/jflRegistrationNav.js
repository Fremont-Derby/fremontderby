const LINKS = [
  '<a href="/players" data-nav-key="players">Players</a>',
  '<a href="/free-agents" data-nav-key="free-agents">Free agents</a>',
  '<a href="/practice" data-nav-key="practice">Practice</a>',
  '<a href="/playoffs" data-nav-key="playoffs">Playoffs</a>',
  '<a href="/trades" data-nav-key="trades">Trades</a>',
  '<a href="/notifications" data-nav-key="notifications">Notifications</a>',
].join('\n      ');

const HOME_SHORTCUTS = `<nav class="fd-home__facts" data-fd-registration-links aria-label="Registration week">
        <a class="fd-home__fact" href="/teams">Teams</a>
        <a class="fd-home__fact" href="/free-agents">Free agents</a>
        <a class="fd-home__fact" href="/practice">Practice</a>
        <a class="fd-home__fact" href="/availability">Check in</a>
      </nav>`;

const TEAMS_CALLOUT = `<aside class="fd-card" data-fd-registration-teams>
      <p><strong>Registration week.</strong> Request a roster below, or stay listed as a free agent if you can fill in.</p>
      <p><a href="/free-agents">See free agents</a> · <a href="/practice">Practice windows</a> · <a href="/availability">Check in</a></p>
    </aside>`;

const SCHEDULE_CALLOUT = `<aside class="fd-card" data-fd-registration-schedule>
      <p><strong>Registration week.</strong> League nights will appear here as they publish. Practice windows are listed separately until then.</p>
      <p><a href="/practice">Practice windows</a> · <a href="/teams">Find a team</a> · <a href="/availability">Check in</a></p>
    </aside>`;

const CHECKIN_CALLOUT = `<aside class="fd-card" data-fd-registration-checkin>
      <p><strong>Registration week.</strong> Mark the weeks you can play so captains can roster you.</p>
      <p><a href="/teams">Find a team</a> · <a href="/free-agents">Free agents</a> · <a href="/practice">Practice</a></p>
    </aside>`;

function injectAfterFirstHeader(source, marker, html, already) {
  if (!source.includes(marker)) return source;
  if (source.includes(already)) return source;
  if (!source.includes('</header>')) return source;
  return source.replace('</header>', `</header>\n    ${html}`);
}

export function injectJflRegistrationNav(html) {
  const source = String(html || '');
  if (!source.includes('data-nav-key="standings"')) return source;
  if (source.includes('data-nav-key="practice"')) return source;
  return source.replace(
    '<a href="/standings" data-nav-key="standings"',
    `${LINKS}\n      <a href="/standings" data-nav-key="standings"`,
  );
}

export function injectJflRegistrationHome(html) {
  const source = String(html || '');
  if (!source.includes('data-fd-modern-home')) return source;
  if (source.includes('data-fd-registration-links')) return source;
  if (!source.includes('</header>')) return source;
  return source.replace('</header>', `${HOME_SHORTCUTS}\n    </header>`);
}

export function injectJflRegistrationTeams(html) {
  return injectAfterFirstHeader(String(html || ''), 'data-fd-modern-teams', TEAMS_CALLOUT, 'data-fd-registration-teams');
}

export function injectJflRegistrationSchedule(html) {
  return injectAfterFirstHeader(String(html || ''), 'data-fd-modern-schedule', SCHEDULE_CALLOUT, 'data-fd-registration-schedule');
}

export function injectJflRegistrationCheckin(html) {
  const source = String(html || '');
  if (!source.includes('<h1>Check in</h1>')) return source;
  return injectAfterFirstHeader(source, '<h1>Check in</h1>', CHECKIN_CALLOUT, 'data-fd-registration-checkin');
}

export async function applyJflRegistrationNav(response) {
  if (!response || !(response.headers.get('content-type') || '').includes('text/html')) {
    return response;
  }
  let html = await response.text();
  html = injectJflRegistrationNav(html);
  html = injectJflRegistrationHome(html);
  html = injectJflRegistrationTeams(html);
  html = injectJflRegistrationSchedule(html);
  html = injectJflRegistrationCheckin(html);
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
